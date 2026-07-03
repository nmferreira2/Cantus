import { Router } from "express";

import contributorRoutes from "./contributor.routes.js";
import healthRoutes from "./health.routes.js";
import massRoutes from "./mass.routes.js";
import scoreRoutes from "./score.routes.js";
import searchRoutes from "./search.routes.js";
import settingRoutes from "./setting.routes.js";
import statisticsRoutes from "./statistics.routes.js";
import songRoutes from "./song.routes.js";
import tagRoutes from "./tag.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/contributors", contributorRoutes);
router.use("/scores", scoreRoutes);
router.use("/masses", massRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/search", searchRoutes);
router.use("/settings", settingRoutes);
router.use("/songs", songRoutes);
router.use("/tags", tagRoutes);

export default router;
