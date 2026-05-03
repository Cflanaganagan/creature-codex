import { Router, type IRouter } from "express";
import healthRouter from "./health";
import creaturesRouter from "./creatures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(creaturesRouter);

export default router;
