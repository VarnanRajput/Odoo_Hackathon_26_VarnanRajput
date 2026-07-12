const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, ActivityLog } = require('../models');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow_jwt_secret_key';

// @route   POST api/auth/signup
// @desc    Register a new employee
router.post('/signup', async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default role 'Employee'
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Employee',
      status: 'Active'
    });

    // Create Activity Log
    await ActivityLog.create({
      action: 'User Registered',
      details: `${name} (${email}) signed up as an employee.`,
      performedBy: user._id
    });

    // Sign Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/auth/login
// @desc    Authenticate employee and get token
router.post('/login', async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter all credentials' });
    }

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Match Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Token expiration
    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn });

    // Create Activity Log
    await ActivityLog.create({
      action: 'User Logged In',
      details: `${user.name} logged into the system.`,
      performedBy: user._id
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      status: req.user.status
    }
  });
});

module.exports = router;
