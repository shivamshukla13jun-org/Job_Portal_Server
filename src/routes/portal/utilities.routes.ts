import { Router } from "express";

import {  getEmployer } from "@/controllers/portal/utillities.controller";

const router = Router();



router.route("/maxsalaryandexp")
    .get( getEmployer)

export default router;