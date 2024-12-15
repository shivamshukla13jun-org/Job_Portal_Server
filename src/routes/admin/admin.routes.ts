import { Router } from "express";
import { createAdmin, deleteAdmin, UpdateUser,loginUser,getAdmins, getAllApplicants,getJobNamesOnly, getJobs, listUsers, planList, updateAdmin, getAllLocations, dashboard, Employers, subemployers } from "@/controllers/admin/admin.controllers";
import { deleteUser } from "@/controllers/admin/user.controllers";

const router = Router();

// routes
router.route("/users").get(listUsers)
router.route("/subemployers").get(subemployers)
router.route("/users/:id").put(UpdateUser).delete(deleteUser)
router.route("/employers").get(Employers)
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