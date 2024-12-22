import { Router } from "express";

import {  ContactUs, getEmployer ,Options} from "@/controllers/portal/utillities.controller";

const router = Router();



router.route("/contactus")
    .post( ContactUs)
router.route("/maxsalaryandexp")
    .get( getEmployer)
router.route("/options/:id/:type")
    .get( Options)

export default router;