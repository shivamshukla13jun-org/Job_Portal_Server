import { Router } from 'express';
import {
  createNewsArticle,
  getNewsArticles,
  getNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
  updateNewsArticleComment,
  commentsList,
  deleteComment
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
  * @desc Get all comments for a news article
 * @route GET /api/v1/admin/news/comments/:id
 * @param {string} id - the ID of the news article
 */
router.route('/comments/:id')
  .get( commentsList);

/**
 * @desc create or update a news article comment
  * @route PUT /api/v1/admin/news/comment/:id
 * @param {string} id - the ID of the user
*/
router.route('/comment/:id')
  .put(verifyToken, updateNewsArticleComment);
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
