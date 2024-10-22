import { Router } from "express";

import {  getEmployer } from "@/controllers/portal/company.controllers";

const router = Router();



router.route("/:id")
    .get( getEmployer)

export default router;