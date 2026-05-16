import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import authRouter from "./auth";
import usersRouter from "./users";
import coachesRouter from "./coaches";
import coursesRouter from "./courses";
import bookingsRouter from "./bookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(coachesRouter);
router.use(coursesRouter);
router.use(bookingsRouter);

export default router;
