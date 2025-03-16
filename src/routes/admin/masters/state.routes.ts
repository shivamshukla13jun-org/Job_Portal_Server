import { Router } from 'express';
import {
  createState,
  getStates,
  getState,
  updateState,
  deleteState,
  getStatesByCountry
} from '@/controllers/admin/masters/state.controller';
import { verifyAdminToken } from '@/middlewares/auth';

const router = Router();

/**
 * @desc Create or get all states
 * @route POST/GET /api/v1/admin/masters/states
 */
router.route('/')
  .post(verifyAdminToken, createState)
  .get( getStates);

/**
 * @desc Get states by country
 * @route GET /api/v1/admin/masters/states/country/:countryId
 */
router.get('/country/:countryId', getStatesByCountry);

/**
 * @desc Get, update or delete a state
 * @route GET/PUT/DELETE /api/v1/admin/masters/states/:id
 */
router.route('/:id')
  .get( getState)
  .put(verifyAdminToken, updateState)
  .delete(verifyAdminToken, deleteState);

export default router;
