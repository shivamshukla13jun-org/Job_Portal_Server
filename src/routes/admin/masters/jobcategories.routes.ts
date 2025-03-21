import { Router } from 'express';
import { verifyAdminToken } from '@/middlewares/auth';
import {
  createJobCategory,
  getJobCategories,
  getJobCategory,
  updateJobCategory,
  deleteJobCategory
} from '@/controllers/admin/masters/jobcategories.controller';
const router = Router();

/**
 * @desc Create or get all job categories
 * @route POST/GET /api/v1/admin/masters/job-categories
 */
router.route('/')
  .post(verifyAdminToken, createJobCategory)
  .get(getJobCategories);

/**
 * @desc Get, update or delete an industry
 * @route GET/PUT/DELETE /api/v1/admin/masters/industries/:id
 * @param {string} id - the ID of the industry
 */
router.route('/:id')
  .get( getJobCategory)
  .put(verifyAdminToken, updateJobCategory)
  .delete(verifyAdminToken, deleteJobCategory);

export default router;
