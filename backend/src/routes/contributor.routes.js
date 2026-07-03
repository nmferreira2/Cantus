import { Router } from "express";
import {
    archiveContributor,
    createContributor,
    getContributor,
    getContributors,
    restoreContributor,
    updateContributor
} from "../controllers/contributor.controller.js";
import {
    validateContributor,
    validateContributorQuery
} from "../validators/contributor.validator.js";

const router = Router();

router.get("/", validateContributorQuery, getContributors);
router.post("/", validateContributor, createContributor);
router.patch("/:id/restore", restoreContributor);
router.get("/:id", getContributor);
router.put("/:id", validateContributor, updateContributor);
router.delete("/:id", archiveContributor);

export default router;
