import express from "express";
import multer from "multer";
import axios from "axios";

const router = express.Router();
const upload = multer(); // ✅ declare only once

// Example route for visual matching
router.post("/", upload.single("image"), async (req, res) => {
  console.log("📦 Received /api/search request");

  try {
    if (!req.file) {
      console.log("❌ No image file found in request");
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    console.log("🖼️ File name:", req.file.originalname);
    const imageBase64 = req.file.buffer.toString("base64");

    // Send to your embed_service model backend
    const response = await axios.post(
      "https://visual-matcher-model.onrender.com/embed", // 👈 change if needed
      { imageBase64: `data:image/jpeg;base64,${imageBase64}` }
    );

    console.log("✅ Model backend response received");
    res.json({ success: true, embedding: response.data.embedding });
  } catch (error) {
    console.error("💥 Error in /api/search:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

export default router;



// import express from "express";
// import multer from "multer";
// import { upload } from "../middlewares/uploadMiddleware.js";
// import { searchProducts } from "../controllers/searchController.js";

// const router = express.Router();
// const upload = multer();

// router.post("/", upload.single("imageFile"), searchProducts);


// export default router;
