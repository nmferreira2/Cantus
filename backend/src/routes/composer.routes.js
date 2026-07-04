import { Router } from "express";
import {
    getComposers,
    mergeComposers
} from "../controllers/composer.controller.js";
import { validateComposerMerge } from "../validators/composer.validator.js";

const router = Router();

router.get("/", getComposers);
router.post("/merge", validateComposerMerge, mergeComposers);

export default router;
