import { Router } from "express";
import multer from "multer";
import { requireSchool } from "../middleware/auth.middleware";
import { schoolRegistrationController } from "../controllers/school-registration.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const schoolRegistrationRouter = Router();

schoolRegistrationRouter.get(
  "/payment-info",
  schoolRegistrationController.paymentInfo,
);

schoolRegistrationRouter.use(requireSchool);

schoolRegistrationRouter.get("/", schoolRegistrationController.getMine);
schoolRegistrationRouter.post(
  "/start",
  schoolRegistrationController.startMine,
);
schoolRegistrationRouter.put("/step/1", schoolRegistrationController.saveStep1);
schoolRegistrationRouter.put("/step/2", schoolRegistrationController.saveStep2);
schoolRegistrationRouter.get(
  "/step/2/template",
  schoolRegistrationController.downloadTemplate,
);
schoolRegistrationRouter.post(
  "/step/2/import",
  upload.single("file"),
  schoolRegistrationController.importStudents,
);
schoolRegistrationRouter.post(
  "/step/3/proof",
  upload.single("file"),
  schoolRegistrationController.uploadProof,
);
schoolRegistrationRouter.get(
  "/step/3/reference-check",
  schoolRegistrationController.checkPaymentReference,
);
schoolRegistrationRouter.put("/step/3", schoolRegistrationController.saveStep3);
schoolRegistrationRouter.get(
  "/students",
  schoolRegistrationController.listMyStudents,
);
schoolRegistrationRouter.get(
  "/students/export.xlsx",
  schoolRegistrationController.exportMyStudentsExcel,
);
schoolRegistrationRouter.get(
  "/students/export.pdf",
  schoolRegistrationController.exportMyStudentsPdf,
);
schoolRegistrationRouter.get(
  "/students/export.print",
  schoolRegistrationController.exportMyStudentsPrint,
);

export default schoolRegistrationRouter;
