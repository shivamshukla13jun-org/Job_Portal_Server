import { Router } from "express";
import path from "path";


import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import createMulterMiddleware from "@/libs/multer";
import { createCV, deleteCV, getCV, getCVs, updateCV } from "@/controllers/candidate/cv.controllers";

const router = Router();

const upload = createMulterMiddleware({
    destination: path.join(__dirname, '../../../uploads/cv'),
    allowedFileTypes: [
        'image/jpeg',
        'image/jpg',
        'image/ico',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
    ],
    maxFileSize: 1024 * 1024 * 10
});

// routes
router.route("/")
    .get(verifyToken, getCVs)
    .post(
        verifyUserTypeToken(["candidate"]),
        upload.fields([
            { name: 'cv[]', maxCount: 5 }
        ]),
        createCV
    );

router.route("/:id")
    .get(verifyUserTypeToken(["candidate", "employer"]), getCV)
    .put(
        verifyUserTypeToken(["candidate"]),
        upload.fields([
            { name: 'cv[]', maxCount: 5 }
        ]),
        updateCV
    )
    .delete(verifyToken, deleteCV)

export default router;