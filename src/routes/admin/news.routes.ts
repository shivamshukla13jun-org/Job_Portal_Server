import { Router } from 'express';
import {
  createNewsArticle,
  getNewsArticles,
  getNewsArticle,
  updateNewsArticle,
  deleteNewsArticle
} from '@/controllers/admin/news.controllers';
import { verifyAdminToken, verifyToken } from '@/middlewares/auth';

const router = Router();

// routes
/**
 * @desc Create or get all news articles
 * @route POST/GET /api/v1/admin/news
 */
router.route('/')
  .post(verifyAdminToken, createNewsArticle)
  .get(verifyAdminToken, getNewsArticles);

/**
 * @desc Get, update or delete a news article
 * @route GET/PUT/DELETE /api/v1/admin/news/:id
 * @param {string} id - the ID of the news article
 */
router.route('/:id')
  .get(verifyAdminToken, getNewsArticle)
  .put(verifyAdminToken, updateNewsArticle)
  .delete(verifyAdminToken, deleteNewsArticle);

export default router;
