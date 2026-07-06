import { Router } from "express";
import {
    getSettings,
    serveLogo,
    updateLogo,
    updateSettings
} from "../controllers/setting.controller.js";
import { uploadLogoImage } from "../middleware/upload.middleware.js";
import { validateSettings } from "../validators/setting.validator.js";
import { requirePermission } from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.get("/", getSettings);
router.put(
    "/",
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    validateSettings,
    updateSettings
);
router.get("/logo", serveLogo);
router.post(
    "/logo",
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    requirePermission(PERMISSIONS.UPLOAD_FILES),
    uploadLogoImage,
    updateLogo
);

export default router;
