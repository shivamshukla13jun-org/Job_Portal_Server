import { addTestimonial, deleteTestimonial, getTestimonial, getTestimonials, updateTestimonial } from "@/controllers/admin/testimonial.controllers";
import { verifyToken } from "@/middlewares/auth";
import { Router } from "express";

const router = Router();

// routes
router.route("/").get(verifyToken, getTestimonials).post(verifyToken, addTestimonial)
router.route("/:id").get(verifyToken, getTestimonial).put(verifyToken, updateTestimonial).delete(verifyToken, deleteTestimonial)

export default router;
