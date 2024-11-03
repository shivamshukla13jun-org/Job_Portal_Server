import {createOrder,verifyPayment,cancelSubscription,
    SubscriptionCreate,
    getSubscription,
    renewSubscription,} from "@/controllers/portal/payment.controller";
import { Router } from "express";
import { verifyToken } from "@/middlewares/auth";
const router = Router();
// plan routes 
router.route("/createOrder/:id").post(verifyToken,createOrder)
router.route("/verify").post(verifyToken,verifyPayment)
router.route("/subscription").post(verifyToken,SubscriptionCreate).get(verifyToken,getSubscription)

export default router