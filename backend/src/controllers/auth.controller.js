import {
    clearedSessionCookie,
    sessionCookie
} from "../utils/auth.config.js";
import { AppError } from "../utils/app-error.js";
import * as service from "../services/auth.service.js";

export async function login(req, res) {
    const username = typeof req.body?.username === "string"
        ? req.body.username.trim()
        : "";
    const password = typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!username || !password) {
        throw new AppError(422, "Introduza o utilizador e a palavra-passe.");
    }

    const result = await service.login(username, password);
    res.setHeader("Set-Cookie", sessionCookie(result.token));
    return res.json(result.user);
}

export async function getCurrentUser(req, res) {
    const user = await service.getAuthenticatedUser(req);
    if (!user) {
        throw new AppError(401, "Inicie sessão para continuar.");
    }

    return res.json(user);
}

export function logout(req, res) {
    res.setHeader("Set-Cookie", clearedSessionCookie());
    return res.status(204).end();
}
