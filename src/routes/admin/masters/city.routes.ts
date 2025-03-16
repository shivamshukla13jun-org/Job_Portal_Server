import { Router } from 'express';
import {
  createCity,
  getCities,
  getCity,
  updateCity,
  deleteCity,
  getCitiesByState
} from '@/controllers/admin/masters/city.controller';
import { verifyAdminToken } from '@/middlewares/auth';

const router = Router();

/**
 * @desc Create or get all cities
 * @route POST/GET /api/v1/admin/masters/cities
 */
router.route('/')
  .post(verifyAdminToken, createCity)
  .get( getCities);

/**
 * @desc Get cities by state
 * @route GET /api/v1/admin/masters/cities/state/:stateId
 */
router.get('/state/:stateId', getCitiesByState);

/**
 * @desc Get, update or delete a city
 * @route GET/PUT/DELETE /api/v1/admin/masters/cities/:id
 */
router.route('/:id')
  .get( getCity)
  .put(verifyAdminToken, updateCity)
  .delete(verifyAdminToken, deleteCity);

export default router;
