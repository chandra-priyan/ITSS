const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const addManager = async () => {
  try {
    await connectDB();

    const managerData = {
      name: "chandra",
      userId: "chandra007",
      password: "12345678"
    };

    // Check if user already exists
    const existingUser = await User.findOne({ userId: managerData.userId });
    if (existingUser) {
      console.log('Manager user already exists');
    } else {
      const manager = await User.create(managerData);
      console.log('Manager user created successfully:', manager);
    }
    
    process.exit();
  } catch (error) {
    console.error(`Error adding manager: ${error.message}`);
    process.exit(1);
  }
};

addManager();
