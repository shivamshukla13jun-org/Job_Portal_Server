import { Router } from "express";
import path from "path";

import { EmployerDashboard } from "@/controllers/portal/employer.controllers";
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { candidateDashboard } from "@/controllers/portal/candidate.controllers";

const router = Router();


// routes

router.route("/employer/:id")
    .get(verifyToken, EmployerDashboard)
router.route("/subemployer/:id")
    .get(verifyToken, EmployerDashboard)
router.route("/candidate")
    .get(verifyUserTypeToken(["candidate","admin"]), candidateDashboard)
// router.route("/dashboard/employer")
//     .get(verifyUserTypeToken(["employer"]), EmployerDashboard)
export default router;