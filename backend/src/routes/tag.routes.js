import { Router } from "express";
import {
    createTag,
    deleteTag,
    getAllTags,
    updateTag
} from "../controllers/tag.controller.js";
import { validateTag, validateTagUpdate } from "../validators/tag.validator.js";
import {
    requirePermission,
    requirePermissionForQueryFlag
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();
const requireTagAdministration = requirePermission(PERMISSIONS.MANAGE_SETTINGS);

router.get(
    "/",
    requirePermissionForQueryFlag(PERMISSIONS.MANAGE_SETTINGS, "includeArchived"),
    getAllTags
);
router.post("/", requireTagAdministration, validateTag, createTag);
router.put("/:id", requireTagAdministration, validateTagUpdate, updateTag);
router.delete("/:id", requireTagAdministration, deleteTag);

export default router;
