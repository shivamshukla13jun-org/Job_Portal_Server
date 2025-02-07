import { Router } from "express";
import { createAdmin, deleteAdmin, UpdateUser,loginUser,getAdmins,updateJob, getAllApplicants,getJobNamesOnly, getJobs, listUsers, planList, updateAdmin, getAllLocations, Employers, subemployers, Dashboard, Options } from "@/controllers/admin/admin.controllers";
import { deleteUser } from "@/controllers/admin/user.controllers";
import { deleteJob } from "@/controllers/portal/job.controllers";

const router = Router();

// routes
/**
 * @desc Get options based on type
 * @route GET /options/:type
 * @param {string} type - the type of options to retrieve
 */
router.route("/options/:type").get(Options)

/**
 * @desc Get all employers
 * @route GET /employers
 */
router.route("/employers").get(Employers)

/**
 * @desc Get list of users
 * @route GET /users
 */
router.route("/users").get(listUsers)

/**
 * @desc Update or delete a user by ID
 * @route PUT/DELETE /users/:id
 * @param {string} id - the ID of the user to update or delete
 */
router.route("/users/:id").put(UpdateUser).delete(deleteUser)

/**
 * @desc Get all jobs
 * @route GET /jobs
 */
router.route("/jobs").get(getJobs)

/**
 * @desc Update or delete a job by ID
 * @route PUT/DELETE /jobs/:id
 * @param {string} id - the ID of the job to update or delete
 */
router.route("/jobs/:id").put(updateJob).delete(deleteJob)

/**
 * @desc Get job names only
 * @route GET /jobs/names
 */
router.route("/jobs/names").get(getJobNamesOnly)

/**
 * @desc Get all sub-employers
 * @route GET /subemployers
 */
router.route("/subemployers").get(subemployers)

/**
 * @desc Get dashboard data
 * @route GET /dashboard
 */
router.route("/dashboard").get(Dashboard)

/**
 * @desc Get all locations
 * @route GET /location
 */
router.route("/location").get(getAllLocations)

/**
 * @desc Get plan list
 * @route GET /plan
 */
router.route("/plan").get(planList)

/**
 * @desc Get all applicants
 * @route GET /applicantions
 */
router.route("/applicantions").get(getAllApplicants)

/**
 * @desc Create a new admin or get all admins
 * @route POST/GET /
 */
router.route('/').post(createAdmin).get(getAdmins);

/**
 * @desc Update or delete an admin by ID
 * @route PUT/DELETE /:id
 * @param {string} id - the ID of the admin to update or delete
 */
router.route('/:id').put(updateAdmin).delete(deleteAdmin);

/**
 * @desc Admin login
 * @route POST /login
 */
router.post('/login', loginUser);

export default router