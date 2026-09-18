import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.routes";
import resultRouter from "./result.routes";
import schoolAuthRouter from "./school-auth.routes";
import schoolRegistrationRouter from "./school-registration.routes";
import adminSchoolRegistrationRouter from "./admin-school-registration.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/results", resultRouter);
apiRouter.use("/school-auth", schoolAuthRouter);
apiRouter.use("/school-registration", schoolRegistrationRouter);
apiRouter.use("/admin/school-registrations", adminSchoolRegistrationRouter);

export default apiRouter;
