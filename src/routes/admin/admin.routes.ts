import { Router } from "express";
import { createAdmin, deleteAdmin, loginUser,getAdmins, getAllApplicants,getJobNamesOnly, getJobs, listUsers, planList, updateAdmin, getAllLocations, dashboard } from "@/controllers/admin/admin.controllers";

const router = Router();

// routes
router.route("/users").get(listUsers)
router.route("/dashboard").get()
router.route("/location").get(getAllLocations)
router.route("/plan").get(planList)
router.route("/jobs").get(getJobs)
router.route("/jobs/names").get(getJobNamesOnly)
router.route("/applicantions").get(getAllApplicants)
router.route('/').post(createAdmin).get(getAdmins);
router.route('/:id').put(updateAdmin).delete(deleteAdmin);
router.post('/login', loginUser);

export default router