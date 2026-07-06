import { Router } from "express";
import {
    archiveContributor,
    createContributor,
    getContributor,
    getContributorSongs,
    getContributors,
    restoreContributor,
    updateContributor
} from "../controllers/contributor.controller.js";
import {
    validateContributor,
    validateContributorQuery
} from "../validators/contributor.validator.js";
import {
    requireOwnContributorOrPermission,
    requirePermission
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.get(
    "/",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    validateContributorQuery,
    getContributors
);
router.post(
    "/",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    validateContributor,
    createContributor
);
router.patch(
    "/:id/restore",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    restoreContributor
);
router.get(
    "/:id/songs",
    requireOwnContributorOrPermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    getContributorSongs
);
router.get(
    "/:id",
    requireOwnContributorOrPermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    getContributor
);
router.put(
    "/:id",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    validateContributor,
    updateContributor
);
router.delete(
    "/:id",
    requirePermission(PERMISSIONS.MANAGE_CONTRIBUTORS),
    archiveContributor
);

export default router;
