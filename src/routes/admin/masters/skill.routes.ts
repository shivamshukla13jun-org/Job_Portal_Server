import { Router } from 'express';
import {
  createSkill,
  getSkills,
  getSkill,
  updateSkill,
  deleteSkill
} from '@/controllers/admin/masters/skill.controller';
import { verifyAdminToken } from '@/middlewares/auth';

const router = Router();

/**
 * @desc Create or get all skills
 * @route POST/GET /api/v1/admin/masters/skills
 */
router.route('/')
  .post(verifyAdminToken, createSkill)
  .get( getSkills);

/**
 * @desc Get, update or delete a skill
 * @route GET/PUT/DELETE /api/v1/admin/masters/skills/:id
 * @param {string} id - the ID of the skill
 */
router.route('/:id')
  .get( getSkill)
  .put(verifyAdminToken, updateSkill)
  .delete(verifyAdminToken, deleteSkill);

export default router;
