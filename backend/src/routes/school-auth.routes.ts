import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireSchool } from "../middleware/auth.middleware";
import { schoolAuthController } from "../controllers/school-auth.controller";

const schoolAuthRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please wait a minute and try again.",
  },
});

const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many reset requests. Please try again later.",
  },
});

const schoolAuthRouter = Router();

schoolAuthRouter.post(
  "/register",
  schoolAuthRateLimit,
  schoolAuthController.register,
);
schoolAuthRouter.post("/login", schoolAuthRateLimit, schoolAuthController.login);
schoolAuthRouter.post("/logout", schoolAuthController.logout);
schoolAuthRouter.get("/me", requireSchool, schoolAuthController.me);
schoolAuthRouter.post(
  "/forgot-password",
  forgotPasswordRateLimit,
  schoolAuthController.forgotPassword,
);
schoolAuthRouter.post(
  "/reset-password",
  schoolAuthRateLimit,
  schoolAuthController.resetPassword,
);

export default schoolAuthRouter;
