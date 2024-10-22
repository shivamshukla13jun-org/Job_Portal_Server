import { addUserType, deleteUserType, getPublicUserType, getUserType, getUserTypes, updateUserType } from "@/controllers/admin/userType.controllers";
import { verifyToken } from "@/middlewares/auth";
import { Router } from "express";

const router = Router();

// routes
router.get("/type", getPublicUserType)
router.route("/").get(verifyToken, getUserTypes).post(verifyToken, addUserType)
router.route("/:id").get(verifyToken, getUserType).put(verifyToken, updateUserType).delete(verifyToken, deleteUserType)

export default router;
