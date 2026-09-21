import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { adminDatabaseService } from "../services/admin-database.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  q: z.string().trim().optional(),
  orderBy: z.string().trim().optional(),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const adminDatabaseController = {
  async listModels(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminDatabaseService.listModels();
      res.json({ success: true, message: "Models", data });
    } catch (err) {
      next(err);
    }
  },

  async listRows(req: Request, res: Response, next: NextFunction) {
    try {
      const model = String(req.params.model || "");
      const query = listQuerySchema.parse(req.query);
      const data = await adminDatabaseService.listRows(model, query);
      res.json({ success: true, message: "Rows", data });
    } catch (err) {
      next(err);
    }
  },

  async getRow(req: Request, res: Response, next: NextFunction) {
    try {
      const model = String(req.params.model || "");
      const id = String(req.params.id || "");
      const data = await adminDatabaseService.getRow(model, id);
      res.json({ success: true, message: "Row", data });
    } catch (err) {
      next(err);
    }
  },

  async createRow(req: Request, res: Response, next: NextFunction) {
    try {
      const model = String(req.params.model || "");
      const body =
        req.body && typeof req.body === "object" && !Array.isArray(req.body)
          ? (req.body as Record<string, unknown>)
          : {};
      const data = await adminDatabaseService.createRow(model, body);
      res.status(201).json({ success: true, message: "Created", data });
    } catch (err) {
      next(err);
    }
  },

  async updateRow(req: Request, res: Response, next: NextFunction) {
    try {
      const model = String(req.params.model || "");
      const id = String(req.params.id || "");
      const body =
        req.body && typeof req.body === "object" && !Array.isArray(req.body)
          ? (req.body as Record<string, unknown>)
          : {};
      const data = await adminDatabaseService.updateRow(model, id, body);
      res.json({ success: true, message: "Updated", data });
    } catch (err) {
      next(err);
    }
  },

  async deleteRow(req: Request, res: Response, next: NextFunction) {
    try {
      const model = String(req.params.model || "");
      const id = String(req.params.id || "");
      const data = await adminDatabaseService.deleteRow(model, id);
      res.json({ success: true, message: "Deleted", data });
    } catch (err) {
      next(err);
    }
  },
};
