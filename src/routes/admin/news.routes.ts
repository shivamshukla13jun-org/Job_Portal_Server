import { Router } from 'express';
import {
  createNewsArticle,
  getNewsArticles,
  getNewsArticle,
  updateNewsArticle,
  deleteNewsArticle
} from '@/controllers/admin/news.controllers';
import { verifyAdminToken, verifyToken } from '@/middlewares/auth';
import { upload } from '@/utils/multer';

const router = Router();

// routes
/**
 * @desc Create or get all news articles
 * @route POST/GET /api/v1/admin/news
 */
router.route('/')
  .post(verifyAdminToken, upload.single('banner'), createNewsArticle)
  .get( getNewsArticles);

/**
 * @desc Get, update or delete a news article
 * @route GET/PUT/DELETE /api/v1/admin/news/:id
 * @param {string} id - the ID of the news article
 */
router.route('/:id')
  .get( getNewsArticle)
  .put(verifyAdminToken, upload.single('banner'), updateNewsArticle)
  .delete(verifyAdminToken, deleteNewsArticle);

export default router;
