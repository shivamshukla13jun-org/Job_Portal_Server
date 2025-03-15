import { Router } from "express";
import { createArticle, deleteArticle, getArticle, getArticles, updateArticle } from "@/controllers/admin/article.controllers";
import { verifyToken } from "@/middlewares/auth";
import { upload } from "@/utils/multer";

const router = Router();

router.post("/", verifyToken, upload.single('banner'), createArticle);
router.get("/", getArticles);
router.get("/:id", getArticle);
router.put("/:id", verifyToken, upload.single('banner'), updateArticle);
router.delete("/:id", verifyToken, deleteArticle);

export default router;