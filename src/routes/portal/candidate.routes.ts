import { Router } from "express";
import path from "path";

import { createCandidate, deleteCandidate, getCandidate, getCandidates, updateCandidate } from "@/controllers/portal/candidate.controllers";
import { verifyUserTypeToken } from "@/middlewares/auth";
import createMulterMiddleware from "@/libs/multer";
import { applyJob ,getAppliedJobs} from "@/controllers/candidate/application.controller";

const router = Router();

const upload = createMulterMiddleware({
    destination: path.join(__dirname, '../../../uploads/candidate'),
    allowedFileTypes: [
        'image/jpeg',
        'image/jpg',
        'image/ico',
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
    maxFileSize: 1024 * 1024 * 10 // 10MB
});

// routes
router.route("/")
    .get(verifyUserTypeToken(["candidate","admin"]), getCandidates)
    .post(
        verifyUserTypeToken(["candidate","admin"]),
        upload.fields([
            { name: 'upload_cv', maxCount: 1 },
            { name: 'profile', maxCount: 1 },
            // { name: 'registration_certificate', maxCount: 1 },
            { name: 'score_card', maxCount: 1 },
            { name: 'certificate[]', maxCount: 5 }
        ]),
        createCandidate
    );

router.route("/:id")
    .get(verifyUserTypeToken(["candidate","admin", "employer"]), getCandidate)
    .put(
        verifyUserTypeToken(["candidate","admin"]),
        upload.fields([
            { name: 'upload_cv', maxCount: 1 },
            { name: 'profile', maxCount: 1 },
            // { name: 'registration_certificate', maxCount: 1 },
            { name: 'score_card', maxCount: 1 },
            { name: 'certificate[]', maxCount: 5 }
        ]),
        updateCandidate
    )
    .delete(verifyUserTypeToken(["candidate","admin"]), deleteCandidate);
router.route('/apply/:id').put(verifyUserTypeToken(["candidate","admin"]),  applyJob);
router.route('/get').get(verifyUserTypeToken(["candidate","admin"]), getAppliedJobs);
export default router;