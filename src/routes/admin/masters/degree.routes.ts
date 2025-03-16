import { Router } from 'express';
import {
  createDegree,
  getDegrees,
  getDegree,
  updateDegree,
  deleteDegree
} from '@/controllers/admin/masters/degree.controller';
import { verifyAdminToken } from '@/middlewares/auth';

const router = Router();

/**
 * @desc Create or get all degrees
 * @route POST/GET /api/v1/admin/masters/degrees
 */
router.route('/')
  .post(verifyAdminToken, createDegree)
  .get( getDegrees);

/**
 * @desc Get, update or delete a degree
 * @route GET/PUT/DELETE /api/v1/admin/masters/degrees/:id
 * @param {string} id - the ID of the degree
 */
router.route('/:id')
  .get( getDegree)
  .put(verifyAdminToken, updateDegree)
  .delete(verifyAdminToken, deleteDegree);

export default router;
