import { Router } from "express";

import {  ApplicationOptions, ContactUs, getAllEmployers, getSalaryRnage ,Options} from "@/controllers/portal/utillities.controller";

const router = Router();



router.route("/contactus")
    .post( ContactUs)
router.route("/maxsalaryandexp")
    .get( getSalaryRnage)
router.route("/employers")
    .get( getAllEmployers)
router.route("/options/:id/:type")
    .get( Options)
router.route("/applicationoptions/:id/:type")
    .get(ApplicationOptions)

export default router;