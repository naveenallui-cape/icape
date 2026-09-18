import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireSchool } from "../middleware/auth.middleware";
import { publicResultRateLimit } from "../middleware/rate-limit.middleware";
import {
  adminResultController,
  publicResultController,
} from "../controllers/result.controller";
import { exportController } from "../controllers/export.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      file.mimetype.includes("sheet") ||
      file.mimetype.includes("excel")
    ) {
      cb(null, true);
      return;
    }
    cb(new Error("Only Excel files (.xlsx / .xls) are allowed"));
  },
});

const resultRouter = Router();

// Public — student results only (school-wide results require school login)
resultRouter.get("/meta", publicResultRateLimit, publicResultController.meta);
resultRouter.get(
  "/student",
  publicResultRateLimit,
  publicResultController.student,
);
resultRouter.get(
  "/student/pdf",
  publicResultRateLimit,
  exportController.studentPdf,
);

// School portal — own school results only
resultRouter.get(
  "/school/mine",
  requireSchool,
  publicResultController.mySchoolResults,
);
resultRouter.get(
  "/school/mine/export",
  requireSchool,
  exportController.mySchoolExcel,
);
resultRouter.get(
  "/school/mine/pdf",
  requireSchool,
  exportController.mySchoolPdf,
);

// Admin — no rate limiting
resultRouter.get(
  "/admin/publication",
  requireAdmin,
  adminResultController.getPublication,
);
resultRouter.patch(
  "/admin/publication",
  requireAdmin,
  adminResultController.setPublication,
);
resultRouter.get("/admin/list", requireAdmin, adminResultController.list);
resultRouter.post(
  "/admin/manual",
  requireAdmin,
  adminResultController.createManual,
);
resultRouter.patch("/admin/:id", requireAdmin, adminResultController.update);
resultRouter.delete("/admin/:id", requireAdmin, adminResultController.remove);
resultRouter.post(
  "/admin/upload/preview",
  requireAdmin,
  upload.single("file"),
  adminResultController.uploadPreview,
);
resultRouter.post(
  "/admin/upload/confirm",
  requireAdmin,
  upload.single("file"),
  adminResultController.uploadConfirm,
);
resultRouter.get("/admin/uploads", requireAdmin, adminResultController.uploads);
resultRouter.get(
  "/admin/uploads/:id/status",
  requireAdmin,
  adminResultController.uploadStatus,
);
resultRouter.get(
  "/admin/uploads/:id/errors",
  requireAdmin,
  adminResultController.uploadErrors,
);
resultRouter.get(
  "/admin/uploads/:id/errors/download",
  requireAdmin,
  adminResultController.uploadErrorsDownload,
);

export default resultRouter;
