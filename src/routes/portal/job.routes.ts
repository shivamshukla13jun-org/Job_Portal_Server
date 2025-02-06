import { Router } from "express";

import { createJob, getJobs, getJob, updateJob, deleteJob, getEmployerJobs, getEmployerJob, getEmployerJobNamesOnly,  } from "@/controllers/portal/job.controllers";
import { verifyisCandidateLogin, verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { applyJob } from "@/controllers/candidate/application.controller";

const router = Router();

// routes
router.put("/apply/:id", verifyToken, applyJob);

router.route("/employer")
    .get(verifyUserTypeToken(["employer","admin"]), getEmployerJobs);
router.get("/employer/name", verifyUserTypeToken(["employer","admin"]), getEmployerJobNamesOnly);
router.route("/employer/:id")
    .get(verifyUserTypeToken(["employer","admin"]), getEmployerJob);

router.route("/")
    .get(verifyisCandidateLogin,getJobs)
    .post(
        verifyUserTypeToken(["employer","admin"]),
        createJob
    );

router.route("/:id")
    .get(verifyisCandidateLogin, getJob)
    .put(
        verifyUserTypeToken(["employer","admin"]),
        updateJob
    )
    .delete(verifyUserTypeToken(["employer","admin"]), deleteJob);

export default router;