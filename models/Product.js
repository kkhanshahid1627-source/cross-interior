const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'Uncategorized' },
  additionalImages: [{ type: String }],
  stock: { type: Number, default: 10 }
});

module.exports = mongoose.model("Product", ProductSchema);