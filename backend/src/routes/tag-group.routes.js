import { Router } from "express";
import {
    createTagGroup,
    deleteTagGroup,
    getAllTagGroups,
    updateTagGroup
} from "../controllers/tag-group.controller.js";
import {
    requirePermission,
    requirePermissionForQueryFlag
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";
import {
    validateTagGroup,
    validateTagGroupUpdate
} from "../validators/tag-group.validator.js";

const router = Router();
const requireTagAdministration = requirePermission(PERMISSIONS.MANAGE_SETTINGS);

router.get(
    "/",
    requirePermissionForQueryFlag(PERMISSIONS.MANAGE_SETTINGS, "includeArchived"),
    getAllTagGroups
);
router.post("/", requireTagAdministration, validateTagGroup, createTagGroup);
router.put(
    "/:id",
    requireTagAdministration,
    validateTagGroupUpdate,
    updateTagGroup
);
router.delete("/:id", requireTagAdministration, deleteTagGroup);

export default router;
