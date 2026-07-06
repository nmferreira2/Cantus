import { Router } from "express";
import {
    getComposer,
    getComposers,
    mergeComposers,
    serveComposerPhoto,
    updateComposerPhoto,
    updateComposerProfile
} from "../controllers/composer.controller.js";
import {
    validateComposerMerge,
    validateComposerProfile
} from "../validators/composer.validator.js";
import { uploadComposerImage } from "../middleware/upload.middleware.js";
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
router.get("/:name/photo", serveComposerPhoto);
router.put(
    "/:name/profile",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    validateComposerProfile,
    updateComposerProfile
);
router.post(
    "/:name/photo",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    requirePermission(PERMISSIONS.UPLOAD_FILES),
    uploadComposerImage,
    updateComposerPhoto
);
router.get(
    "/:name",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    getComposer
);

export default router;
