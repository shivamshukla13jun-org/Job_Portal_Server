import { Router } from "express";
import path from "path";

import { createEmployer, getEmployers, getEmployer, updateEmployer, deleteEmployer, ForwardCV, getSubEmployers } from "@/controllers/portal/employer.controllers";
import { verifyUserTypeToken } from "@/middlewares/auth";
import createMulterMiddleware from "@/libs/multer";
import { getApplicants,updateStatus,getAllApplicants } from "@/controllers/candidate/application.controller";

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
router.route("/forwardcv").post(verifyUserTypeToken(["employer"]),ForwardCV)
router.route("/getSubEmployers/:id").get(verifyUserTypeToken(["employer"]),getSubEmployers)
// routes
router.route("/")
    .get(verifyUserTypeToken(["employer"]), getEmployers)
    .post(
        verifyUserTypeToken(["employer"]),
        upload.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'videos[]', maxCount: 5 },
            { name: 'pictures[]', maxCount: 5 },
        ]),
        createEmployer
    );

router.route("/:id")
    .get(verifyUserTypeToken(["employer"]), getEmployer)
    .put(
        verifyUserTypeToken(["employer"]),
        upload.fields([
            { name: 'logo', maxCount: 1 },
            { name: 'videos[]', maxCount: 5 },
            { name: 'pictures[]', maxCount: 5 },
        ]),
        updateEmployer
    )
    .delete(verifyUserTypeToken(["employer"]), deleteEmployer);
export default router;