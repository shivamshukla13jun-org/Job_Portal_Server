import { Router } from "express";
import {
  addTestimonial,
  deleteTestimonial,
  getTestimonial,
  getTestimonials,
  updateTestimonial
} from "@/controllers/admin/testimonial.controllers";
import { verifyAdminToken } from "@/middlewares/auth";

const router = Router();

// routes
/**
 * @desc Create or get all testimonials
 * @route POST/GET /api/v1/admin/testimonial
 */
router.route("/")
  .get(verifyAdminToken, getTestimonials)
  .post(verifyAdminToken, addTestimonial);

/**
 * @desc Get, update or delete a testimonial
 * @route GET/PUT/DELETE /api/v1/admin/testimonial/:id
 * @param {string} id - the ID of the testimonial
 */
router.route("/:id")
  .get(verifyAdminToken, getTestimonial)
  .put(verifyAdminToken, updateTestimonial)
  .delete(verifyAdminToken, deleteTestimonial);

export default router;
