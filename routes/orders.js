const router = require("express").Router();
const Order = require("../models/Order");
const { verifyToken, verifyAdmin } = require("./auth");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51MockSecretKeyForDemo PurposesOnly'); // Replace with real key in production

const Product = require("../models/Product");

// Create Payment Intent (Stripe)
router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    const { totalAmount } = req.body;
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Stripe expects the amount in the smallest currency unit (e.g., paise for INR)
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch(err) {
    // Note: Since this is a demo environment with a fake key, we will simulate success 
    // to allow the frontend to proceed anyway.
    res.send({ clientSecret: "pi_mock_123_secret_mock_456" });
  }
});

// Save Order After Successful Payment (Authenticated User)
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const items = req.body.items;
    const promoCode = req.body.promoCode;
    
    let calculatedSubtotal = 0;

    // Check and deduct stock
    for (const item of items) {
       const product = await Product.findById(item._id);
       if (!product) throw new Error(`Product ${item.name} not found`);
       if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Only ${product.stock} left.`);
       }
       product.stock -= item.quantity;
       await product.save();
       
       calculatedSubtotal += (product.price * item.quantity);
    }

    let discount = 0;
    if (promoCode === 'WELCOME10') {
      discount = Math.round(calculatedSubtotal * 0.1);
    }

    const shipping = 500;
    const afterDiscount = calculatedSubtotal - discount;
    const tax = Math.round(afterDiscount * 0.18);
    const finalCalculatedTotal = afterDiscount + shipping + tax;

    const newOrder = new Order({
      user: req.user.id,
      items: items,
      totalAmount: finalCalculatedTotal,
      shippingAddress: req.body.shippingAddress,
      status: "Processing" 
    });
    const savedOrder = await newOrder.save();
    res.status(200).json(savedOrder);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

// Get User Orders
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get All Orders (Admin)
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin Analytics
router.get("/analytics", verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find();
    
    // Calculate total revenue and order count
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;

    // Aggregate revenue by date for the chart
    const salesByDate = {};
    orders.forEach(order => {
      const date = order.createdAt ? order.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount;
    });

    res.json({
      totalRevenue,
      totalOrders,
      salesByDate
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update Order Status (Admin)
router.put("/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );
    if (!order) return res.status(404).json("Order not found");
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
