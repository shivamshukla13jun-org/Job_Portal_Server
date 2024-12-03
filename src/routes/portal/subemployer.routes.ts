import express from 'express';
import SubEmployerController from '@/controllers/portal/SubEmployer.controllers';
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { getAllShortlistApplicants } from '@/controllers/candidate/application.controller';

const router = express.Router();

// Create a new sub-employer
router.route("/").post( 
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.createSubEmployer
).get( 
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.getSubEmployers
);
router.route('/shortlistcvs').get( verifyUserTypeToken(["subemployer"]),SubEmployerController.getForwardedCVs);
router.route('/meetings').post( verifyUserTypeToken(["subemployer"]),SubEmployerController.CreateMeetingLink);
// Update sub-employer
router.route("/:id")
.get(verifyToken,SubEmployerController.getSubEmployersDetails)
.put(
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.updateSubEmployer
);



export default router;