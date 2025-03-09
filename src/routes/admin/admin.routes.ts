import { Router } from "express";
import { createAdmin, deleteAdmin, UpdateUser, loginUser, getAdmins, updateJob, getAllApplicants, getJobNamesOnly, getJobs, listUsers, planList, updateAdmin, getAllLocations, Employers, subemployers, Dashboard, Options } from "@/controllers/admin/admin.controllers";
import { deleteUser } from "@/controllers/admin/user.controllers";
import { deleteJob } from "@/controllers/portal/job.controllers";
import newsRoutes from './news.routes';
import testimonialRoutes from './testimonial.routes';
import {  verifyAdminToken } from "@/middlewares/auth";

const router = Router();

// routes
/**
 * @desc Get options based on type
 * @route GET /options/:type
 * @param {string} type - the type of options to retrieve
 */
router.route("/options/:type").get(verifyAdminToken, Options)

/**
 * @desc Get all employers
 * @route GET /employers
 */
router.route("/employers").get(verifyAdminToken, Employers)

/**
 * @desc Get list of users
 * @route GET /users
 */
router.route("/users").get(verifyAdminToken, listUsers)

/**
 * @desc Update or delete a user by ID
 * @route PUT/DELETE /users/:id
 * @param {string} id - the ID of the user to update or delete
 */
router.route("/users/:id").put(verifyAdminToken, UpdateUser).delete(verifyAdminToken, deleteUser)

/**
 * @desc Get all jobs
 * @route GET /jobs
 */
router.route("/jobs").get(verifyAdminToken, getJobs)

/**
 * @desc Update or delete a job by ID
 * @route PUT/DELETE /jobs/:id
 * @param {string} id - the ID of the job to update or delete
 */
router.route("/jobs/:id").put(verifyAdminToken, updateJob).delete(verifyAdminToken, deleteJob)

/**
 * @desc Get job names only
 * @route GET /jobs/names
 */
router.route("/jobs/names").get(verifyAdminToken, getJobNamesOnly)

/**
 * @desc Get all sub-employers
 * @route GET /subemployers
 */
router.route("/subemployers").get(verifyAdminToken, subemployers)

/**
 * @desc Get dashboard data
 * @route GET /dashboard
 */
router.route("/dashboard").get(verifyAdminToken, Dashboard)

/**
 * @desc Get all locations
 * @route GET /location
 */
router.route("/location").get(verifyAdminToken, getAllLocations)

/**
 * @desc Get plan list
 * @route GET /plan
 */
router.route("/plan").get(verifyAdminToken, planList)

/**
 * @desc Get all applicants
 * @route GET /applicantions
 */
router.route("/applicantions").get(verifyAdminToken,getAllApplicants)

/**
 * @desc Create a new admin or get all admins
 * @route POST/GET /
 */
router.route('/').post(verifyAdminToken, createAdmin).get(verifyAdminToken, getAdmins);

/**
 * @desc Update or delete an admin by ID
 * @route PUT/DELETE /:id
 * @param {string} id - the ID of the admin to update or delete
 */
router.route('/:id').put(verifyAdminToken, updateAdmin).delete(verifyAdminToken, deleteAdmin);

/**
 * @desc Admin login
 * @route POST /login
 */
router.post('/login', loginUser);

// Mount news routes
router.use('/news', newsRoutes);

// Mount testimonial routes
router.use('/testimonial', testimonialRoutes);

export default router