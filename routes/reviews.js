const router = require('express').Router();
const Review = require('../models/Review');
const { verifyToken } = require('./auth');

// Add a Review
router.post('/add', verifyToken, async (req, res) => {
  try {
    const newReview = new Review({
       user: req.user.id,
       product: req.body.productId,
       rating: req.body.rating,
       comment: req.body.comment
    });
    const saved = await newReview.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get Reviews for a Product
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name').sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch(err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
