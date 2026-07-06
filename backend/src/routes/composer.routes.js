import { Router } from "express";
import {
    getComposer,
    getComposers,
    mergeComposers
} from "../controllers/composer.controller.js";
import { validateComposerMerge } from "../validators/composer.validator.js";
import { requirePermission } from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.get(
    "/",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    getComposers
);
router.post(
    "/merge",
    requirePermission(PERMISSIONS.MERGE_CONTRIBUTORS),
    validateComposerMerge,
    mergeComposers
);
router.get(
    "/:name",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    getComposer
);

export default router;
