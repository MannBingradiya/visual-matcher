import express from "express";
import multer from "multer";
import { upload } from "../middlewares/uploadMiddleware.js";
import { searchProducts } from "../controllers/searchController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.post("/search", upload.single("imageFile"), searchProducts);


export default router;
