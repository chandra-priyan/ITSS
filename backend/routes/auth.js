const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Seed the default user if it doesn't exist
const seedUser = async () => {
  try {
    const existingUser = await User.findOne({ userId: 'chandra007' });
    if (!existingUser) {
      await User.create({
        name: 'chandra',
        userId: 'chandra007',
        password: '12345678' // In a real app, hash this!
      });
      console.log('Default user seeded: chandra007');
    }
  } catch (err) {
    console.error('Error seeding user:', err);
  }
};

// Seed immediately when the route is loaded
seedUser();

router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid user ID or password' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid user ID or password' });
    }

    // Return success
    res.json({
      success: true,
      user: {
        name: user.name,
        userId: user.userId
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

module.exports = router;
