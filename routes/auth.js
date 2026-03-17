const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).json("Access Denied");
  try {
    const verified = jwt.verify(token, "secret");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json("Invalid Token");
  }
};

// Middleware to verify Admin
const verifyAdmin = async (req, res, next) => {
  verifyToken(req, res, async () => {
    try {
      const user = await User.findById(req.user.id);
      if (user.role === 'admin') {
        next();
      } else {
        res.status(403).json("You do not have permission to perform this action");
      }
    } catch (err) {
      res.status(500).json("Server Error");
    }
  });
};

router.post("/register", async (req, res) => {
  try {
    // Check if user already exists
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).json("Email already exists");

    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hash,
      role: req.body.role || 'user' // Allow setting role during development if needed
    });
    await user.save();
    res.json("User created successfully");
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.status(400).json("Wrong password");

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "secret");
  res.json({ token, role: user.role, name: user.name });
});

// Get Current User Profile (Populated)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate('wishlist');
    res.json(user);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// Update Profile
router.put("/update", verifyToken, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: req.body.name } },
      { new: true }
    ).select("-password");
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json("Error updating profile");
  }
});

// Toggle Wishlist Item
router.post("/wishlist/toggle/:productId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const productId = req.params.productId;
    
    // Check if it already exists
    const index = user.wishlist.indexOf(productId);
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }
    
    await user.save();
    res.json(user.wishlist);
  } catch(err) {
    res.status(500).json("Error toggling wishlist");
  }
});

// Mock Password Reset
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json("No account with that email found.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json("Password reset successful");
  } catch (err) {
    res.status(500).json("Error resetting password");
  }
});

// Export middlewares as well
module.exports = { router, verifyToken, verifyAdmin };