import { Router } from 'express';
import { manageSavedJobs,getSavedJobsAll, getSavedJobs } from '../../controllers/candidate/savedjobs.controller';
import { verifyToken, verifyUserTypeToken } from "@/middlewares/auth";

const router = Router();

// Route to manage wishlist (add/remove job IDs)

router.route("/").post(verifyUserTypeToken(["candidate"]), manageSavedJobs).get(verifyUserTypeToken(["candidate"]), getSavedJobs) // operation can be 'add' or 'remove', id is jobId
router.route("/all").get(verifyUserTypeToken(["candidate"]), getSavedJobsAll) // operation can be 'add' or 'remove', id is jobId

export default router;
