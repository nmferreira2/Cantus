import { Router } from "express";
import {
    getCurrentUser,
    login,
    logout
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/me", getCurrentUser);
router.post("/login", login);
router.post("/logout", logout);

export default router;
