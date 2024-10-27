import { Router } from "express";
import path from "path";

import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { applyJob ,getAppliedJobs,updateStatus,getAllApplicants, getApplicants,getEmployerJobNamesOnly} from "@/controllers/candidate/application.controller";

const router = Router();

router.get("/applied", verifyToken, getAppliedJobs);
router.route('/apply/:id').put(verifyUserTypeToken(["candidate"]),  applyJob);
router.route('/status/:id').put( verifyUserTypeToken(["employer"]),  updateStatus);
router.route('/tracking').get( verifyUserTypeToken(["employer"]),  getAllApplicants);
router.route('/job/:id').get( verifyUserTypeToken(["employer"]),  getApplicants);
router.route('/jobs/employer/name').get( verifyUserTypeToken(["employer"]),  getEmployerJobNamesOnly);
export default router;