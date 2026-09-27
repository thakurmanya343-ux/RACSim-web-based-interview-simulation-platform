const express = require('express');
const router = express.Router();
const { posts } = require('../db');

/**
 * GET /api/posts
 * List all available job posts.
 */
router.get('/', (req, res) => {
  try {
    const allPosts = posts.getAll();
    res.json({
      success: true,
      count: allPosts.length,
      data: allPosts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts/:id
 * Retrieve a single job post by ID.
 */
router.get('/:id', (req, res) => {
  try {
    const post = posts.getById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: `Post '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
