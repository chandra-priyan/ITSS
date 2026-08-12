const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

router.post('/', async (req, res) => {
  try {
    const { query, history } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required.' });
    }

    const response = await axios.post(`${PYTHON_RAG_SERVICE_URL}/chat`, { query, history: history || [] });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("Chat proxy error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to communicate with the Chatbot service.',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
