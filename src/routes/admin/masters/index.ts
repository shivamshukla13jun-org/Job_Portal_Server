import { Router } from 'express';
import skillRoutes from './skill.routes';
import industryRoutes from './industry.routes';
import degreeRoutes from './degree.routes';
import cityRoutes from './city.routes';
import stateRoutes from './state.routes';
import countryRoutes from './country.routes';
import jobCategoriesRoutes from './jobcategories.routes';
const router = Router();

// Mount routes
router.use('/skills', skillRoutes);
router.use('/industries', industryRoutes);
router.use('/job-categories', jobCategoriesRoutes);
router.use('/degrees', degreeRoutes);
router.use('/cities', cityRoutes);
router.use('/states', stateRoutes);
router.use('/countries', countryRoutes);

export default router;
