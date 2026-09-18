import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware";
import { authController } from "../controllers/result.controller";

const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAdmin, authController.me);

export default authRouter;
