import { Router } from "express";
import path from "path";

import { createEmployer, getEmployers, getEmployer, updateEmployer, deleteEmployer, CandidatesForEmployer,ForwardCV, getSubEmployers, AllCandidates } from "@/controllers/portal/employer.controllers";
import { verifyUserTypeToken } from "@/middlewares/auth";
import createMulterMiddleware from "@/libs/multer";
import meetingControllers from "@/controllers/portal/meeting.controllers";

const router = Router();

const upload = createMulterMiddleware({
    destination: path.join(__dirname, '../../../uploads/employer'),
    allowedFileTypes: [
        'image/jpeg',
        'image/jpg', 'video/mp4',
        'image/ico',
        'image/avif',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',      // Added PDF
        'application/msword',   // Added DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Added DOCX
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Added XLSX
        'text/csv'              // Added CSV
    ],
    maxFileSize: 1024 * 1024 * 10
});
// Forward Cvs
router.route("/forwardcv").post(verifyUserTypeToken(["employer","admin"]),ForwardCV)
// Forward candidates
router.route("/candidates").get(verifyUserTypeToken(["employer"]),CandidatesForEmployer)
router.route("/allcandidates/:id").get(verifyUserTypeToken(["employer","subemployer"]),AllCandidates)
// Forward SubEmployers
router.route("/getSubEmployers/:id").get(verifyUserTypeToken(["employer","admin"]),getSubEmployers)
// Forward SubEmployers
router.route("/meetings/:id").get(verifyUserTypeToken(["employer","admin","subemployer"]),meetingControllers.EmployerMeetingLinklists)
// Single Employer Details
router.route("/")
    .get(verifyUserTypeToken(["employer","admin",]), getEmployers)
    .post(
        verifyUserTypeToken(["employer","admin"]),
        upload.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'videos[]', maxCount: 5 },
            { name: 'pictures[]', maxCount: 5 },
        ]),
        createEmployer
    );

router.route("/:id")
    .get(verifyUserTypeToken(["employer","admin","subemployer"]), getEmployer)
    .put(
        verifyUserTypeToken(["employer","admin","subemployer"]),
        upload.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'video[]', maxCount: 5 },
            { name: 'picture[]', maxCount: 5 },
        ]),
        updateEmployer
    )
    .delete(verifyUserTypeToken(["employer","admin"]), deleteEmployer);
export default router;