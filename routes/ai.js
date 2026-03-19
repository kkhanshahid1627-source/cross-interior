const router = require("express").Router();
const multer = require("multer");
const Replicate = require("replicate");

// Setup Multer to store uploaded file in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize Replicate client
// It automatically picks up REPLICATE_API_TOKEN from process.env
const replicate = new Replicate();

// POST /api/ai/transform
router.post("/transform", upload.single("roomImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No image file uploaded." });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      // Graceful fallback if Replicate token is not set
      return res.status(500).json({ 
        status: "error", 
        message: "Missing REPLICATE_API_TOKEN. Please add your token to the Render environment variables." 
      });
    }

    // Convert image buffer to base64 Data URI
    const mimeType = req.file.mimetype;
    const base64Image = req.file.buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    console.log("Sending image to Replicate for transformation...");

    // Call Replicate's API (using jagilley/controlnet-hough as an interior design model)
    // You can swap the model version hash if you want a specific interior design model.
    const output = await replicate.run(
      "jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
      {
        input: {
          image: dataUri,
          prompt: "a modern premium living room, natural sunlight, aesthetic interior design, ultra realistic, highly detailed",
          num_samples: "1",
          image_resolution: "512",
          a_prompt: "best quality, extremely detailed",
          n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality"
        }
      }
    );

    // output from controlnet-hough is typically an array of image strings
    const transformedImageUrl = Array.isArray(output) ? output[output.length - 1] : output;

    console.log("Replicate generation successful:", transformedImageUrl);

    res.json({
      status: "success",
      imageUrl: transformedImageUrl
    });

  } catch (error) {
    console.error("AI Transformation Error:", error.message);
    res.status(500).json({ 
      status: "error", 
      message: error.message || "Failed to transform image with AI." 
    });
  }
});

module.exports = router;
