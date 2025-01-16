import express from 'express';
import SubEmployerController from '@/controllers/portal/SubEmployer.controllers';
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { getAllShortlistApplicants } from '@/controllers/candidate/application.controller';
import meetingControllers from '@/controllers/portal/meeting.controllers';

const router = express.Router();

// Create a new sub-employer
router.route("/").post( 
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.createSubEmployer
).get( 
    verifyUserTypeToken(["employer","admin"]), 
    SubEmployerController.getSubEmployers
);
router.route('/forwarded').get( verifyUserTypeToken(["subemployer","employer"]),SubEmployerController.getForwardedCVs)
.delete( verifyUserTypeToken(["subemployer","employer"]),SubEmployerController.deleteForwardedCVs
)
// Meeting Links
router.route('/meetings').get( verifyUserTypeToken(["subemployer","employer"]),meetingControllers.MeetingLinklists).post( verifyUserTypeToken(["subemployer","employer"]),meetingControllers.CreateMeetingLink)
router.route('/meetings/:id').delete(verifyUserTypeToken(["subemployer","employer"]),meetingControllers.deleteMeetingLink)

// End Meeting Links 
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