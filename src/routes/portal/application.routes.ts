import { Router } from "express";
import path from "path";

import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { applyJob ,getAppliedJobs,interviewconfirmation,updateStatus,getAllApplicants,deleteapplication, getApplicants,getEmployerJobNamesOnly, WIdrawJob, singleApplicant} from "@/controllers/candidate/application.controller";

const router = Router();

router.get("/applied", verifyToken, getAppliedJobs);
router.get("/applicant/:applicantId", verifyToken, singleApplicant);
router.delete("/applied/:id", verifyToken, WIdrawJob);
router.route('/apply/:id').put(verifyUserTypeToken(["candidate"]),  applyJob);
router.route('/status/:id').put( verifyUserTypeToken(["employer","admin","subemployer"]),  updateStatus);
router.route('/interviewconfirmation/:id').put( verifyUserTypeToken(["employer","admin","subemployer",'candidate']),  interviewconfirmation);
router.route('/job/:jobId/:applicationId').get( verifyUserTypeToken(["employer","admin","candidate","subemployer"]),  deleteapplication);
router.route('/tracking').get( verifyUserTypeToken(["employer","admin"]),  getAllApplicants);
router.route('/job/:id').get( verifyUserTypeToken(["employer","admin"]),  getApplicants);
router.route('/jobs/employer/name').get( verifyUserTypeToken(["employer","admin"]),  getEmployerJobNamesOnly);
export default router;