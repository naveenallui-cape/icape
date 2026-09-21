import { Router } from "express";
import { requireAdmin } from "../middleware/auth.middleware";
import { adminDatabaseController } from "../controllers/admin-database.controller";

const adminDatabaseRouter = Router();

adminDatabaseRouter.use(requireAdmin);

adminDatabaseRouter.get("/models", adminDatabaseController.listModels);
adminDatabaseRouter.get("/:model", adminDatabaseController.listRows);
adminDatabaseRouter.get("/:model/:id", adminDatabaseController.getRow);
adminDatabaseRouter.post("/:model", adminDatabaseController.createRow);
adminDatabaseRouter.patch("/:model/:id", adminDatabaseController.updateRow);
adminDatabaseRouter.delete("/:model/:id", adminDatabaseController.deleteRow);

export default adminDatabaseRouter;
