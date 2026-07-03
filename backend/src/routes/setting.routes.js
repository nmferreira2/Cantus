import { Router } from "express";
import {
    getSettings,
    serveLogo,
    updateLogo,
    updateSettings
} from "../controllers/setting.controller.js";
import { uploadLogoImage } from "../middleware/upload.middleware.js";
import { validateSettings } from "../validators/setting.validator.js";

const router = Router();

router.get("/", getSettings);
router.put("/", validateSettings, updateSettings);
router.get("/logo", serveLogo);
router.post("/logo", uploadLogoImage, updateLogo);

export default router;
