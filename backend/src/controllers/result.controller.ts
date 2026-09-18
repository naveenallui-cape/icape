import { NextFunction, Request, Response } from "express";
import {
  clearAdminCookie,
  getRequestAdmin,
  getRequestSchool,
  setAdminCookie,
  signAdminToken,
} from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import { authService, resultService } from "../services/result.service";
import { uploadService } from "../services/upload.service";
import { CURRENT_OLYMPIAD_YEAR } from "../lib/olympiad-year";
import {
  adminLoginSchema,
  adminResultsQuerySchema,
  manualResultsCreateSchema,
  schoolMineResultsQuerySchema,
  schoolResultsQuerySchema,
  schoolSearchQuerySchema,
  studentResultQuerySchema,
} from "../validators/result.validators";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = adminLoginSchema.parse(req.body);
      const admin = await authService.login(body.email, body.password);
      const token = await signAdminToken({
        sub: admin.id,
        email: admin.email,
        name: admin.name,
      });
      setAdminCookie(res, token);
      res.json({
        success: true,
        message: "Logged in",
        data: admin,
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response) {
    clearAdminCookie(res);
    res.json({ success: true, message: "Logged out" });
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const session = getRequestAdmin(req);
      const admin = await authService.me(session.sub);
      res.json({ success: true, message: "OK", data: admin });
    } catch (err) {
      next(err);
    }
  },
};

export const publicResultController = {
  async student(req: Request, res: Response, next: NextFunction) {
    try {
      const query = studentResultQuerySchema.parse(req.query);
      const data = await resultService.getStudentResults(query);
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300",
      );
      res.json({ success: true, message: "Student results", data });
    } catch (err) {
      next(err);
    }
  },

  async schoolSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const query = schoolSearchQuerySchema.parse(req.query);
      const data = await resultService.searchSchools(query);
      res.json({ success: true, message: "Schools", data });
    } catch (err) {
      next(err);
    }
  },

  async schoolResults(req: Request, res: Response, next: NextFunction) {
    try {
      const query = schoolResultsQuerySchema.parse(req.query);
      if (!query.schoolCode && !query.schoolId) {
        throw new AppError("School ID is required", 400);
      }
      const data = await resultService.getSchoolResults(query);
      res.json({ success: true, message: "School results", data });
    } catch (err) {
      next(err);
    }
  },

  /** Logged-in school: results for their school only */
  async mySchoolResults(req: Request, res: Response, next: NextFunction) {
    try {
      const school = getRequestSchool(req);
      const query = schoolMineResultsQuerySchema.parse(req.query);
      const data = await resultService.getMySchoolResults(school.sub, query);
      res.json({ success: true, message: "School results", data });
    } catch (err) {
      next(err);
    }
  },

  async meta(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await resultService.listMeta();
      res.json({ success: true, message: "Meta", data });
    } catch (err) {
      next(err);
    }
  },
};

export const adminResultController = {
  async getPublication(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await resultService.getPublication();
      res.json({ success: true, message: "Publication status", data });
    } catch (err) {
      next(err);
    }
  },

  async setPublication(req: Request, res: Response, next: NextFunction) {
    try {
      const published = Boolean(req.body?.published);
      const data = await resultService.setPublication(published);
      res.json({
        success: true,
        message: published
          ? "Results are now published for schools and public lookup"
          : "Results are unpublished — schools and public cannot view them",
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminResultsQuerySchema.parse(req.query);
      const data = await resultService.adminListResults(query);
      res.json({ success: true, message: "Results", data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const data = await resultService.adminDeleteResult(id);
      res.json({ success: true, message: "Deleted", data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const data = await resultService.adminUpdateResult(id, req.body ?? {});
      res.json({ success: true, message: "Updated", data });
    } catch (err) {
      next(err);
    }
  },

  async createManual(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getRequestAdmin(req);
      const body = manualResultsCreateSchema.parse(req.body ?? {});
      const data = await resultService.adminCreateManualResults(
        body.rows,
        admin.sub,
      );
      if (data.saved === 0) {
        res.status(400).json({
          success: false,
          message:
            data.errors[0]?.message ||
            "No results were saved. Check the form fields.",
          data,
        });
        return;
      }
      res.json({
        success: true,
        message: `Saved ${data.saved} result(s)`,
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  async uploadPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getRequestAdmin(req);
      const file = req.file;
      if (!file) throw new AppError("Excel file is required", 400);

      const olympiadCode = String(req.body.olympiadCode || "").toUpperCase();
      const grade = req.body.grade ? Number(req.body.grade) : undefined;
      if (!["IMO", "ISO", "IEO"].includes(olympiadCode)) {
        throw new AppError("Invalid olympiad", 400);
      }

      const data = await uploadService.previewAndImport({
        buffer: file.buffer,
        fileName: file.originalname,
        olympiadCode: olympiadCode as "IMO" | "ISO" | "IEO",
        olympiadYearLabel: CURRENT_OLYMPIAD_YEAR,
        grade: Number.isFinite(grade) ? grade : undefined,
        adminId: admin.sub,
        confirm: false,
      });
      res.json({ success: true, message: "Upload preview", data });
    } catch (err) {
      next(err);
    }
  },

  async uploadConfirm(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = getRequestAdmin(req);
      const file = req.file;
      if (!file) throw new AppError("Excel file is required", 400);

      const olympiadCode = String(req.body.olympiadCode || "").toUpperCase();
      const grade = req.body.grade ? Number(req.body.grade) : undefined;
      if (!["IMO", "ISO", "IEO"].includes(olympiadCode)) {
        throw new AppError("Invalid olympiad", 400);
      }

      let correctedRows: unknown[] = [];
      if (req.body.correctedRows) {
        try {
          correctedRows =
            typeof req.body.correctedRows === "string"
              ? JSON.parse(req.body.correctedRows)
              : req.body.correctedRows;
        } catch {
          throw new AppError("Invalid correctedRows JSON", 400);
        }
        if (!Array.isArray(correctedRows)) {
          throw new AppError("correctedRows must be an array", 400);
        }
      }

      const data = await uploadService.previewAndImport({
        buffer: file.buffer,
        fileName: file.originalname,
        olympiadCode: olympiadCode as "IMO" | "ISO" | "IEO",
        olympiadYearLabel: CURRENT_OLYMPIAD_YEAR,
        grade: Number.isFinite(grade) ? grade : undefined,
        adminId: admin.sub,
        confirm: true,
        correctedRows: correctedRows as Array<{
          rowNumber?: number;
          registrationNumber: string;
          studentName: string;
          schoolName: string;
          place?: string;
          state?: string;
          grade: number;
          marksObtained: number;
          totalMarks?: number;
          percentage?: number;
          rank?: number | null;
        }>,
      });
      res.json({
        success: true,
        message: "Import started",
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  async uploads(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await uploadService.listUploads();
      res.json({ success: true, message: "Upload history", data });
    } catch (err) {
      next(err);
    }
  },

  async uploadStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await uploadService.getUploadStatus(String(req.params.id));
      res.json({ success: true, message: "Upload status", data });
    } catch (err) {
      next(err);
    }
  },

  async uploadErrors(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await uploadService.getUploadErrors(String(req.params.id));
      res.json({ success: true, message: "Upload errors", data });
    } catch (err) {
      next(err);
    }
  },

  async uploadErrorsDownload(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await uploadService.downloadUploadErrorsExcel(
        String(req.params.id),
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${data.fileName}"`,
      );
      res.send(data.buffer);
    } catch (err) {
      next(err);
    }
  },
};
