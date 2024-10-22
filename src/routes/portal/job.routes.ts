import { Router } from "express";

import { createJob, getJobs, getJob, updateJob, deleteJob, getEmployerJobs, getEmployerJob, applyJob, getEmployerJobNamesOnly, acceptCandidateForJob, declineCandidateForJob, getShortlistedCandidatesByEmployer } from "@/controllers/portal/job.controllers";
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";

const router = Router();

// routes
router.put("/apply/:id", verifyToken, applyJob);

router.route("/employer")
    .get(verifyUserTypeToken(["employer"]), getEmployerJobs);
router.get("/employer/name", verifyUserTypeToken(["employer"]), getEmployerJobNamesOnly);
router.route("/employer/:id")
    .get(verifyUserTypeToken(["employer"]), getEmployerJob);

router.put("/shortlist/:id", verifyToken, acceptCandidateForJob);
router.put("/decline/:id", verifyToken, declineCandidateForJob);

router.get("/shortlistedCandidate/:id", verifyUserTypeToken(["employer"]), getShortlistedCandidatesByEmployer)

router.route("/")
    .get(getJobs)
    .post(
        verifyUserTypeToken(["employer"]),
        createJob
    );

router.route("/:id")
    .get(getJob)
    .put(
        verifyUserTypeToken(["employer"]),
        updateJob
    )
    .delete(verifyUserTypeToken(["employer"]), deleteJob);

export default router;