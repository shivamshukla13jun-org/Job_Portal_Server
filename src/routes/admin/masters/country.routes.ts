import { Router } from 'express';
import {
  createCountry,
  getCountries,
  getCountry,
  updateCountry,
  deleteCountry
} from '@/controllers/admin/masters/country.controller';
import { verifyAdminToken } from '@/middlewares/auth';

const router = Router();

/**
 * @desc Create or get all countries
 * @route POST/GET /api/v1/admin/masters/countries
 */
router.route('/')
  .post(verifyAdminToken, createCountry)
  .get( getCountries);

/**
 * @desc Get, update or delete a country
 * @route GET/PUT/DELETE /api/v1/admin/masters/countries/:id
 */
router.route('/:id')
  .get( getCountry)
  .put(verifyAdminToken, updateCountry)
  .delete(verifyAdminToken, deleteCountry);

export default router;
