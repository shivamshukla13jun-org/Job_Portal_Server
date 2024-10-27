import { Router } from "express";
import path from "path";

import { EmployerDashboard } from "@/controllers/portal/employer.controllers";
import { verifyUserTypeToken } from "@/middlewares/auth";
import { candidateDashboard } from "@/controllers/portal/candidate.controllers";

const router = Router();


// routes

router.route("/employer")
    .get(verifyUserTypeToken(["employer"]), EmployerDashboard)
router.route("/candidate")
    .get(verifyUserTypeToken(["candidate"]), candidateDashboard)
// router.route("/dashboard/employer")
//     .get(verifyUserTypeToken(["employer"]), EmployerDashboard)
export default router;