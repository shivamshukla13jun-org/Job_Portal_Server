import { Router } from "express";
import {  authenticateByGoogle, callbackByGoogle, deleteUser, forgotUser, getUser, getUsers, loginUser, registerUser, resendOtp, resetAuthenticatedUser, resetUser, updateUser, verifyUser } from "@/controllers/admin/user.controllers";
import { verifyToken } from "@/middlewares/auth";
import { getAppliedJobs } from "@/controllers/candidate/application.controller";
import { getUserMenu } from "@/controllers/portal/menu.controllers";

const router = Router();

// routes
router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/google", authenticateByGoogle);
router.get("/google/callback", callbackByGoogle);
router.post("/verify", verifyUser)
router.get("/menu/:id", getUserMenu)
router.post("/resend", resendOtp)
router.post("/forgot", forgotUser)
router.post("/reset",verifyToken, resetUser)
router.put("/reset/:id", verifyToken, resetAuthenticatedUser)

router.get("/job/applied", verifyToken, getAppliedJobs);

router.route("/").get(verifyToken, getUsers)
router.route("/:id").get(verifyToken, getUser).put(verifyToken, updateUser).delete(verifyToken, deleteUser)
export default router;
