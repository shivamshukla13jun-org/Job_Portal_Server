import { Router } from "express";

import { createJob, getJobs, getJob, updateJob, deleteJob, getEmployerJobs, getEmployerJob, getEmployerJobNamesOnly,  } from "@/controllers/portal/job.controllers";
import { verifyisCandidateLogin, verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { applyJob } from "@/controllers/candidate/application.controller";

const router = Router();

// routes
router.put("/apply/:id", verifyToken, applyJob);

router.route("/employer")
    .get(verifyUserTypeToken(["employer"]), getEmployerJobs);
router.get("/employer/name", verifyUserTypeToken(["employer"]), getEmployerJobNamesOnly);
router.route("/employer/:id")
    .get(verifyUserTypeToken(["employer"]), getEmployerJob);



router.route("/")
    .get(getJobs)
    .post(
        verifyUserTypeToken(["employer"]),
        createJob
    );

router.route("/:id")
    .get(verifyisCandidateLogin, getJob)
    .put(
        verifyUserTypeToken(["employer"]),
        updateJob
    )
    .delete(verifyUserTypeToken(["employer"]), deleteJob);

export default router;