import { Router } from "express";
import {
    archiveMass,
    createMass,
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

const router = Router();

router.get("/", validateMassQuery, getMasses);
router.post("/", validateMass, createMass);
router.get("/calendar", validateCalendarQuery, getCalendar);
router.get("/references", getReferences);
router.patch("/:id/restore", restoreMass);
router.get("/:id", getMass);
router.put("/:id", validateMass, updateMass);
router.delete("/:id", archiveMass);

export default router;
