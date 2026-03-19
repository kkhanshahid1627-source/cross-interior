const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth").router; // .router is now exported individually
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders"); // New orders route
const reviewRoutes = require("./routes/reviews");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crossinterior");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes); // Bind new routes
app.use("/api/reviews", reviewRoutes);

const Product = require("./models/Product");

app.get("/api/seed-database", async (req, res) => {
  try {
    const productsToSeed = [
      { name: "Luxury Modern Cloud Sofa", price: 45000, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", description: "Experience unparalleled comfort with our cloud sofa, featuring premium velvet upholstery and deep seating for ultimate relaxation.", category: "Sofas", stock: 15 },
      { name: "Minimalist Leather Sectional", price: 65000, image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800", description: "Sleek and durable leather sectional perfectly designed for a modern aesthetic.", category: "Sofas", stock: 8 },
      { name: "Classic Tufted Loveseat", price: 35000, image: "https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800", description: "Elegant tufted backrest with sloped arms, bringing a timeless classic look to your living space.", category: "Sofas", stock: 12 },
      { name: "Solid Oak Dining Table", price: 28000, image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800", description: "Crafted from solid oak wood, this dining table seats up to 6 people comfortably while maintaining a minimalist profile.", category: "Tables", stock: 20 },
      { name: "Marble Top Coffee Table", price: 15000, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800", description: "Luxurious marble top with a brass finished metallic frame, an eye-catching centerpiece for your living room.", category: "Tables", stock: 25 },
      { name: "Rustic Wooden Side Table", price: 8500, image: "https://images.unsplash.com/photo-1601392740428-11157200c822?w=800", description: "Add a touch of nature with this raw edge rustic side table, perfect for lamps and books.", category: "Tables", stock: 30 },
      { name: "Ergonomic Lounge Chair", price: 18000, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800", description: "Sculptured to follow the natural curve of your body, offering great support and unmatched style.", category: "Chairs", stock: 40 },
      { name: "Velvet Accent Dining Chair", price: 6500, image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800", description: "Plush velvet seating combined with gold-tipped metal legs for a glamorous dining experience.", category: "Chairs", stock: 60 },
      { name: "Nordic Wood Armchair", price: 12500, image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800", description: "Clean lines and a woven seat make this chair a staple in Scandinavian inspired interiors.", category: "Chairs", stock: 20 },
      { name: "Abstract Geometric Rug", price: 14000, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", description: "Bring the room together with this soft, low-pile rug featuring bold geometric patterns.", category: "Decor", stock: 50 },
      { name: "Brass Table Lamp", price: 4500, image: "https://images.unsplash.com/photo-1507473885746-fc3f1da7ad64?w=800", description: "Warm and inviting light housed in a sleek brass fixture, perfect for reading nooks.", category: "Decor", stock: 100 },
      { name: "Minimalist Wall Art Set", price: 7500, image: "https://plus.unsplash.com/premium_photo-1661962325337-4c0709424c15?w=800", description: "A set of 3 abstract prints in natural oak frames, ready to elevate any blank wall.", category: "Decor", stock: 35 }
    ];
    await Product.insertMany(productsToSeed);
    res.json({ success: true, message: "Products seeded successfully via temporary endpoint!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});