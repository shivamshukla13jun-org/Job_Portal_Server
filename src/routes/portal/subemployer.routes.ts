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
router.route('/shortlistcvs').get( verifyUserTypeToken(["subemployer"]),SubEmployerController.getForwardedCVs)
.delete( verifyUserTypeToken(["subemployer"]),SubEmployerController.deleteForwardedCVs)
router.route('/meetings').get( verifyUserTypeToken(["subemployer"]),SubEmployerController.MeetingLinklists).post( verifyUserTypeToken(["subemployer"]),SubEmployerController.CreateMeetingLink)

router.route('/meetings/:id').delete(verifyUserTypeToken(["subemployer"]),SubEmployerController.deleteMeetingLink)
router.route('/activate/:id').put( verifyUserTypeToken(["employer"]),SubEmployerController.ActivateDeactivate);
// Update sub-employer
router.route("/:id")
.get(verifyToken,SubEmployerController.getSubEmployersDetails)
.put(
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.updateSubEmployer
)
.delete(
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.deleteSubEmployer
)



export default router;