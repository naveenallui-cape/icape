import { Request, Response, NextFunction } from "express";
import {
  clearSchoolCookie,
  getRequestSchool,
  setSchoolCookie,
  signSchoolToken,
} from "../middleware/auth.middleware";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  schoolLoginSchema,
  schoolRegisterSchema,
} from "../validators/school.validators";
import { schoolAuthService } from "../services/school-auth.service";

export const schoolAuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const body = schoolRegisterSchema.parse(req.body);
      const account = await schoolAuthService.register(body);
      const token = await signSchoolToken({
        sub: account.id,
        email: account.email,
        name: account.name,
        role: "school",
      });
      setSchoolCookie(res, token);
      res.status(201).json({
        success: true,
        message: "Account created",
        data: account,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = schoolLoginSchema.parse(req.body);
      const account = await schoolAuthService.login(body.email, body.password);
      const token = await signSchoolToken({
        sub: account.id,
        email: account.email,
        name: account.name,
        role: "school",
      });
      setSchoolCookie(res, token);
      res.json({
        success: true,
        message: "Logged in",
        data: account,
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearSchoolCookie(res);
      res.json({ success: true, message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const session = getRequestSchool(req);
      const account = await schoolAuthService.me(session.sub);
      res.json({ success: true, message: "OK", data: account });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = forgotPasswordSchema.parse(req.body);
      await schoolAuthService.forgotPassword(body.email);
      res.json({
        success: true,
        message: "A 4-digit OTP has been sent to your email.",
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const body = resetPasswordSchema.parse(req.body);
      await schoolAuthService.resetPassword(body);
      res.json({
        success: true,
        message: "Password updated. You can log in now.",
      });
    } catch (err) {
      next(err);
    }
  },
};
