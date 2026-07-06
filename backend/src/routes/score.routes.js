import { Router } from "express";
import {
    addScoreVersion,
    archiveScore,
    archiveScoreVersion,
    createScore,
    getScore,
    getScores,
    restoreScore,
    serveScoreVersion,
    updateScore
} from "../controllers/score.controller.js";
import { uploadScoreDocument } from "../middleware/upload.middleware.js";
import {
    validateScoreCreate,
    validateScoreQuery,
    validateScoreUpdate
} from "../validators/score.validator.js";
import {
    requirePermission,
    requirePermissionForArchived
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.get(
    "/",
    requirePermissionForArchived(PERMISSIONS.DELETE_SCORES),
    validateScoreQuery,
    getScores
);
router.post(
    "/",
    requirePermission(PERMISSIONS.MANAGE_SCORES),
    requirePermission(PERMISSIONS.UPLOAD_FILES),
    uploadScoreDocument,
    validateScoreCreate,
    createScore
);
router.post(
    "/:id/versions",
    requirePermission(PERMISSIONS.MANAGE_SCORES),
    requirePermission(PERMISSIONS.UPLOAD_FILES),
    uploadScoreDocument,
    addScoreVersion
);
router.get("/:id/versions/:versionId/file", serveScoreVersion);
router.delete(
    "/:id/versions/:versionId",
    requirePermission(PERMISSIONS.DELETE_SCORES),
    archiveScoreVersion
);
router.patch(
    "/:id/restore",
    requirePermission(PERMISSIONS.MANAGE_SCORES),
    restoreScore
);
router.get("/:id", getScore);
router.put(
    "/:id",
    requirePermission(PERMISSIONS.MANAGE_SCORES),
    validateScoreUpdate,
    updateScore
);
router.delete(
    "/:id",
    requirePermission(PERMISSIONS.DELETE_SCORES),
    archiveScore
);

export default router;
