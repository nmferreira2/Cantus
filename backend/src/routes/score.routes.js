import { Router } from "express";
import {
    addScoreVersion,
    archiveScore,
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

const router = Router();

router.get("/", validateScoreQuery, getScores);
router.post("/", uploadScoreDocument, validateScoreCreate, createScore);
router.post("/:id/versions", uploadScoreDocument, addScoreVersion);
router.get("/:id/versions/:versionId/file", serveScoreVersion);
router.patch("/:id/restore", restoreScore);
router.get("/:id", getScore);
router.put("/:id", validateScoreUpdate, updateScore);
router.delete("/:id", archiveScore);

export default router;
