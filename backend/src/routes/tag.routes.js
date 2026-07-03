import { Router } from "express";
import { createTag, getAllTags } from "../controllers/tag.controller.js";
import { validateTag } from "../validators/tag.validator.js";

const router = Router();

router.get("/", getAllTags);
router.post("/", validateTag, createTag);

export default router;
