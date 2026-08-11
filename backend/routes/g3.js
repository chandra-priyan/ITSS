const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Customer = require('../models/Customer');
const { processDocument } = require('../services/documentService');
const { extractDocumentData } = require('../services/extractionService');
const Analysis = require('../models/Analysis');

// Setup multer for temporary uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported document type. Please upload PDF, DOCX, JPG, JPEG or PNG.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document uploaded.' });
    }

    const { customerId } = req.body;
    let textInfo;

    try {
      textInfo = await processDocument(req.file);
    } catch (docError) {
      // Clean up file if text extraction fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: docError.message });
    }

    let extractionResult;
    try {
      extractionResult = await extractDocumentData(textInfo.text);
    } catch (aiError) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: aiError.message });
    }

    // Clean up file after successful extraction
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Failed to delete temp file:', cleanupError);
    }

    // Customer Matching Logic
    let customerMatch = null;
    if (customerId) {
      const dbCustomer = await Customer.findOne({ customer_id: customerId });
      if (dbCustomer) {
        const docName = extractionResult.extractedData.customerName;
        if (docName) {
          const dbName = dbCustomer.name_1.toLowerCase().trim();
          const parsedDocName = docName.toLowerCase().trim();
          // Simple inclusion check or exact match
          if (parsedDocName === dbName || dbName.includes(parsedDocName) || parsedDocName.includes(dbName)) {
            customerMatch = { status: 'MATCH', message: 'Confirmed' };
          } else {
            customerMatch = { status: 'REVIEW_REQUIRED', message: `Database name: ${dbCustomer.name_1}` };
          }
        } else {
          customerMatch = { status: 'REVIEW_REQUIRED', message: 'Name not found in document' };
        }
      } else {
        customerMatch = { status: 'NOT_AVAILABLE', message: 'Customer ID not found in database' };
      }
    }

    const finalResult = {
      success: true,
      document: {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        ocrUsed: textInfo.ocrUsed
      },
      customerMatch,
      extractedData: extractionResult.extractedData,
      summary: extractionResult.summary
    };

    // Save Analysis History
    try {
      await Analysis.create({
        analysisType: 'G3_DOCUMENT_SUMMARY',
        customerId: customerId || 'UNKNOWN',
        customerName: extractionResult.extractedData.customerName || 'Unknown',
        status: 'COMPLETED',
        summary: `Document processed: ${req.file.originalname}`,
        result: {
          document: finalResult.document,
          customerMatch,
          extractedData: finalResult.extractedData,
          summary: finalResult.summary
        }
      });
    } catch (e) {
      console.error("Failed to save G3 analysis history", e);
    }

    return res.json(finalResult);
  } catch (error) {
    console.error("G3 Route Error:", error);
    // Attempt cleanup if crashed unexpectedly
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Document exceeds the maximum allowed size.' });
      }
    }
    res.status(500).json({ success: false, message: error.message || 'An internal server error occurred.' });
  }
});

module.exports = router;
