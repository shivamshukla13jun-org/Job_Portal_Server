import express from 'express';
import { Router } from 'express';
import {
  createMenu,
  getMenuByUserType,
  updateMenu,
  deleteMenu
} from '@/controllers/portal/menu.controllers';

const router: Router = express.Router();


// Menu management routes
router.post('/', createMenu);
router.get('/:userTypeId', getMenuByUserType);
router.put('/:permissionId', updateMenu);

export default router;