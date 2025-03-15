import { Router } from "express";

import userRoutes from "@/routes/admin/user.routes";
import userTypeRoutes from "@/routes/admin/userType.routes";
import testimonialRoutes from "@/routes/admin/testimonial.routes";
import articleRoutes from "@/routes/admin/article.routes";

import resumeRoutes from "@/routes/candidate/resume.routes";
import WhishListRoutes from "@/routes/candidate/savedjobs.routes";
import cvRoutes from "@/routes/candidate/cv.routes";

import employerRoutes from "@/routes/portal/employer.routes";
import subemployerRoutes from "@/routes/portal/subemployer.routes";
import candidateRoutes from "@/routes/portal/candidate.routes";
import applicationRoutes from "@/routes/portal/application.routes";
import companyRoutes from "@/routes/portal/company.routes";
import jobRoutes from "@/routes/portal/job.routes";
import utilitiesRoutes from "@/routes/portal/utilities.routes";
import dashboardRoutes from "@/routes/portal/dashboard.routes";
import menuRoutes from "@/routes/admin/menu.routes";
import planRoutes from "@/routes/admin/plan.routes";
import adminRoutes from "@/routes/admin/admin.routes";
import paymentRoutes from "@/routes/admin/payment.routes";
import mastersRoutes from "@/routes/admin/masters";
const router = Router();

router.use("/user", userRoutes);
router.use("/usertype", userTypeRoutes);
router.use("/testimonial", testimonialRoutes);
router.use("/article", articleRoutes);

router.use("/resume", resumeRoutes);
router.use("/whishlist", WhishListRoutes);
router.use("/cv", cvRoutes);

router.use("/candidate", candidateRoutes);
router.use("/application", applicationRoutes);
router.use("/employer", employerRoutes);
router.use("/sub-employers", subemployerRoutes);
router.use("/company", companyRoutes);
router.use("/job", jobRoutes);

router.use("/utilities", utilitiesRoutes);
router.use("/dashboard", dashboardRoutes)
router.use("/menu", menuRoutes)
router.use("/plan", planRoutes)
router.use("/admin", adminRoutes)
router.use("/payment", paymentRoutes)
router.use("/masters", mastersRoutes);



export default router;
