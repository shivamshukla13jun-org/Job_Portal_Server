import { Router } from "express";

import {  ApplicationOptions, ContactUs, getEmployer ,Options} from "@/controllers/portal/utillities.controller";

const router = Router();



router.route("/contactus")
    .post( ContactUs)
router.route("/maxsalaryandexp")
    .get( getEmployer)
router.route("/options/:id/:type")
    .get( Options)
router.route("/applicationoptions/:id/:type")
    .get(ApplicationOptions)

export default router;