import { Router } from "express";
import {
    archiveUser,
    createUser,
    getUsers,
    updateUser
} from "../controllers/user.controller.js";
import { requirePermission } from "../middleware/auth.middleware.js";
import {
    validateUserCreate,
    validateUserUpdate
} from "../validators/user.validator.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

router.use(requirePermission(PERMISSIONS.MANAGE_USERS));
router.get("/", getUsers);
router.post("/", validateUserCreate, createUser);
router.put("/:id", validateUserUpdate, updateUser);
router.delete("/:id", archiveUser);

export default router;
