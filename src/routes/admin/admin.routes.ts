import { Router } from "express";
import {  authenticateByGoogle, callbackByGoogle, deleteUser, forgotUser, getUser, getUsers, loginUser, registerUser, resendOtp, resetAuthenticatedUser, resetUser, updateUser, verifyUser } from "@/controllers/admin/user.controllers";
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { getAllApplicants,getJobNamesOnly, getJobs, listUsers, planList } from "@/controllers/admin/admin.controllers";

const router = Router();

// routes
router.route("/users").get(listUsers)
router.route("/plan").get(planList)
router.route("/jobs").get(getJobs)
router.route("/jobs/names").get(getJobNamesOnly)
router.route("/applicantions").get(getAllApplicants)
export default router;
