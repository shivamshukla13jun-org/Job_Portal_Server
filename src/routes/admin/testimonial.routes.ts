import { Router } from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonial,
  getTestimonials,
  updateTestimonial
} from "@/controllers/admin/testimonial.controllers";
import { verifyAdminToken } from "@/middlewares/auth";
import { upload } from "@/utils/multer";

const router = Router();

// routes
/**
 * @desc Create or get all testimonials
 * @route POST/GET /api/v1/admin/testimonial
 */
router.route("/")
  .get(getTestimonials)
  .post(verifyAdminToken, upload.single('asset'), createTestimonial);

/**
 * @desc Get, update or delete a testimonial
 * @route GET/PUT/DELETE /api/v1/admin/testimonial/:id
 * @param {string} id - the ID of the testimonial
 */
router.route("/:id")
  .get(getTestimonial)
  .put(verifyAdminToken, upload.single('asset'), updateTestimonial)
  .delete(verifyAdminToken, deleteTestimonial);

export default router;
