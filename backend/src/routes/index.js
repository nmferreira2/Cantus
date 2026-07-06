import { Router } from "express";

import { requireAuthentication } from "../middleware/auth.middleware.js";
import authRoutes from "./auth.routes.js";
import composerRoutes from "./composer.routes.js";
import contributorRoutes from "./contributor.routes.js";
import healthRoutes from "./health.routes.js";
import massRoutes from "./mass.routes.js";
import scoreRoutes from "./score.routes.js";
import searchRoutes from "./search.routes.js";
import settingRoutes from "./setting.routes.js";
import statisticsRoutes from "./statistics.routes.js";
import songRoutes from "./song.routes.js";
import tagRoutes from "./tag.routes.js";
import tagGroupRoutes from "./tag-group.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use(requireAuthentication);
router.use("/composers", composerRoutes);
router.use("/contributors", contributorRoutes);
router.use("/scores", scoreRoutes);
router.use("/masses", massRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/search", searchRoutes);
router.use("/settings", settingRoutes);
router.use("/songs", songRoutes);
router.use("/tags", tagRoutes);
router.use("/tag-groups", tagGroupRoutes);
router.use("/users", userRoutes);

export default router;
