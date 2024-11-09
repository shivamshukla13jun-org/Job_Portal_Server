import { Router } from "express";

import {  ContactUs, getEmployer } from "@/controllers/portal/utillities.controller";

const router = Router();



router.route("/contactus")
    .post( ContactUs)
router.route("/maxsalaryandexp")
    .get( getEmployer)

export default router;