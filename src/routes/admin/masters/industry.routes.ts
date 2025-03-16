import { Router } from 'express';
import {
  createIndustry,
  getIndustries,
  getIndustry,
  updateIndustry,
  deleteIndustry
} from '@/controllers/admin/masters/industry.controller';
import { verifyAdminToken } from '@/middlewares/auth';

const router = Router();

/**
 * @desc Create or get all industries
 * @route POST/GET /api/v1/admin/masters/industries
 */
router.route('/')
  .post(verifyAdminToken, createIndustry)
  .get(getIndustries);

/**
 * @desc Get, update or delete an industry
 * @route GET/PUT/DELETE /api/v1/admin/masters/industries/:id
 * @param {string} id - the ID of the industry
 */
router.route('/:id')
  .get( getIndustry)
  .put(verifyAdminToken, updateIndustry)
  .delete(verifyAdminToken, deleteIndustry);

export default router;
