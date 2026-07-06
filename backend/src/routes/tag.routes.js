import { Router } from "express";
import { createTag, getAllTags } from "../controllers/tag.controller.js";
import { validateTag } from "../validators/tag.validator.js";
import { requirePermission } from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.get("/", getAllTags);
router.post(
    "/",
    requirePermission(PERMISSIONS.MANAGE_SONGS),
    validateTag,
    createTag
);

export default router;
