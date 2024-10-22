import { Router } from "express";

import {  getEmployer } from "@/controllers/portal/utillities.controller";

const router = Router();



router.route("/maxsalary")
    .get( getEmployer)

export default router;