import { Router } from "express";
import { createAdmin, deleteAdmin, UpdateUser,loginUser,getAdmins,updateJob, getAllApplicants,getJobNamesOnly, getJobs, listUsers, planList, updateAdmin, getAllLocations, Employers, subemployers, Dashboard, EmployersOptions } from "@/controllers/admin/admin.controllers";
import { deleteUser } from "@/controllers/admin/user.controllers";
import { deleteJob } from "@/controllers/portal/job.controllers";

const router = Router();

// routes
router.route("/users").get(listUsers)
router.route("/subemployers").get(subemployers)
router.route("/users/:id").put(UpdateUser).delete(deleteUser)
router.route("/employers").get(Employers)
router.route("/options/:type").get(EmployersOptions)
router.route("/dashboard").get(Dashboard)
router.route("/location").get(getAllLocations)
router.route("/plan").get(planList)
router.route("/jobs").get(getJobs)
router.route("/jobs/:id").put(updateJob).delete(deleteJob)
router.route("/jobs/names").get(getJobNamesOnly)
router.route("/applicantions").get(getAllApplicants)
router.route('/').post(createAdmin).get(getAdmins);
router.route('/:id').put(updateAdmin).delete(deleteAdmin);
router.post('/login', loginUser);

export default router