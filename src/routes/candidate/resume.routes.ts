import { Router } from "express";
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";
import { createResume, getResumes, getResume, updateResume, deleteResume, getResumeForCandidate } from "@/controllers/candidate/resume.controllers";
import createMulterMiddleware from "@/libs/multer";
import path from "path";

const router = Router();

const upload = createMulterMiddleware({
    destination: path.join(__dirname, '../../../uploads/resume'),
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
router.get("/candidate/:id", verifyUserTypeToken(["candidate", "employer","subemployer"]), getResumeForCandidate)

router.route("/")
    .get(verifyToken, getResumes)
    .post(verifyUserTypeToken(["candidate", "employer","subemployer"]), createResume);

router.route("/:id")
    .get(verifyUserTypeToken(["candidate", "employer","subemployer"]), getResume)
    .put(
        verifyUserTypeToken(["candidate"]),
        upload.single("portfolio"),
        updateResume
    )
    .delete(verifyToken, deleteResume)

export default router;