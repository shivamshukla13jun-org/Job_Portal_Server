import { Router } from "express";
import path from "path";

import { CandidateMatchGraphByEmployer, EmployerDashboard } from "@/controllers/portal/employer.controllers";
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { candidateDashboard } from "@/controllers/portal/candidate.controllers";

const router = Router();


// routes

router.route("/employer/:id")
    .get(verifyUserTypeToken(["employer","admin","subemployer"]), EmployerDashboard)
router.route("/subemployer/:id")
    .get(verifyUserTypeToken(["subemployer","admin"]), EmployerDashboard)
router.route("/candidate")
    .get(verifyUserTypeToken(["candidate","admin"]), candidateDashboard)

 // graph
    router.route("/graph/employer/:id")
        .get(verifyUserTypeToken(["employer","admin"]), CandidateMatchGraphByEmployer)
    router.route("/graph/subemployer/:id")
        .get(verifyUserTypeToken(["subemployer","admin"]), EmployerDashboard)
    router.route("/graph/candidate")
        .get(verifyUserTypeToken(["candidate","admin"]), candidateDashboard)


export default router;