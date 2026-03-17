const router = require("express").Router();
const Product = require("../models/Product");
const { verifyAdmin } = require("./auth");

// Add Product (Admin Only)
router.post("/add", verifyAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

// Get All Products (Public, with optional category & search filter)
router.get("/", async (req, res) => {
  try {
    const qCategory = req.query.category;
    const qSearch = req.query.search;
    
    let query = {};
    
    if (qCategory && qCategory !== 'All') {
      query.category = qCategory;
    }
    
    if (qSearch) {
      query.$or = [
        { name: { $regex: qSearch, $options: 'i' } },
        { description: { $regex: qSearch, $options: 'i' } }
      ];
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

// Get Single Product by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json("Product not found");
    res.json(product);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Delete Product (Admin Only)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json("Product deleted");
  } catch (err) {
    res.status(400).json(err.message);
  }
});

module.exports = router;