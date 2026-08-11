const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes will be added here
app.use('/api/customers', require('./routes/customers'));
app.use('/api/customer360', require('./routes/customer360'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai/g2', require('./routes/g2'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
