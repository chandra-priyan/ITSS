const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes will be added here
const customerRoutes = require('./routes/customers');
const customer360Routes = require('./routes/customer360');
const aiRoutes = require('./routes/ai');
const g2Routes = require('./routes/g2');
const g3Routes = require('./routes/g3');
const g4Routes = require('./routes/g4');
const historyRoutes = require('./routes/history');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');

app.use('/api/customers', customerRoutes);
app.use('/api/customer360', customer360Routes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/g2', g2Routes);
app.use('/api/ai/g3', g3Routes);
app.use('/api/ai/g4', g4Routes);
app.use('/api/history', historyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'banking-ai-rm-backend'
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
