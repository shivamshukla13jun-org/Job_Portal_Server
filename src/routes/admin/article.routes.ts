import { Router } from "express";
import { verifyToken } from "@/middlewares/auth";
import { createArticle, deleteArticle, getArticle, getArticles, updateArticle } from "@/controllers/admin/article.controllers";

const router = Router();

// routes
router.route("/").get(getArticles).post(verifyToken, createArticle)
router.route("/:id").get(getArticle).put(verifyToken, updateArticle).delete(verifyToken, deleteArticle)

export default router;