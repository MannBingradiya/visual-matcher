import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
// import { searchProducts } from "../controllers/searchController.js";
import { searchImage } from "../controllers/searchController.js";

const router = express.Router();

// router.post("/", upload.single("imageFile"), searchProducts);

router.post("/search", upload.single("image"), searchImage);

export default router;
