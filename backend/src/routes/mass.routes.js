import { Router } from "express";
import {
    archiveMass,
    createMass,
    exportCelebrationText,
    generateCelebrationPdf,
    getCalendar,
    getMass,
    getMasses,
    getReferences,
    restoreMass,
    updateMass
} from "../controllers/mass.controller.js";
import {
    validateCalendarQuery,
    validateMass,
    validateMassQuery
} from "../validators/mass.validator.js";
import {
    requirePermission,
    requirePermissionForArchived
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.get(
    "/",
    requirePermissionForArchived(PERMISSIONS.MANAGE_MASSES),
    validateMassQuery,
    getMasses
);
router.post(
    "/",
    requirePermission(PERMISSIONS.MANAGE_MASSES),
    validateMass,
    createMass
);
router.get("/calendar", validateCalendarQuery, getCalendar);
router.get("/references", getReferences);
router.get("/:id/celebration-pdf", generateCelebrationPdf);
router.get("/:id/celebration-text", exportCelebrationText);
router.patch(
    "/:id/restore",
    requirePermission(PERMISSIONS.MANAGE_MASSES),
    restoreMass
);
router.get("/:id", getMass);
router.put(
    "/:id",
    requirePermission(PERMISSIONS.MANAGE_MASSES),
    validateMass,
    updateMass
);
router.delete(
    "/:id",
    requirePermission(PERMISSIONS.MANAGE_MASSES),
    archiveMass
);

export default router;
