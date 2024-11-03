import planControllers from "@/controllers/portal/plan.controllers";
import { Router } from "express";
import { verifyToken } from "@/middlewares/auth";
const router = Router();
// plan routes 
router.route("/").get(planControllers.planList).post(planControllers.addPlan).put(verifyToken,planControllers.planUpdate)
router.get('/:id', planControllers.getPlandetailsbyid);

export default router