import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { searchProducts } from "../controllers/searchController.js";

const router = express.Router();

router.post("/", upload.single("imageFile"), searchProducts);

export default router;
