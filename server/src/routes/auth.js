const express = require('express');
const router = express.Router();
const { register, login } = require('../services/authService');
const { requireAuth } = require('../middleware/auth');
const { users } = require('../db');

/**
 * POST /api/auth/register
 * Body: { name, email, password, role: 'candidate' | 'expert' | 'admin', candidateId? }
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role, candidateId } = req.body;
    const result = register({ name, email, password, role, candidateId });
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = login({ email, password });
    res.json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Returns authenticated user profile.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

/**
 * GET /api/auth/users
 * Returns list of system users.
 */
router.get('/users', (req, res) => {
  try {
    const allUsers = users.getAll();
    res.json({
      success: true,
      count: allUsers.length,
      data: allUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
