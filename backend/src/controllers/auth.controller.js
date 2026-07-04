import {
    authenticateCredentials,
    clearedSessionCookie,
    createSessionToken,
    readSession,
    sessionCookie
} from "../utils/auth.config.js";
import { AppError } from "../utils/app-error.js";

export function login(req, res) {
    const username = typeof req.body?.username === "string"
        ? req.body.username.trim()
        : "";
    const password = typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!username || !password) {
        throw new AppError(422, "Introduza o utilizador e a palavra-passe.");
    }

    if (!authenticateCredentials(username, password)) {
        throw new AppError(401, "Utilizador ou palavra-passe incorretos.");
    }

    res.setHeader("Set-Cookie", sessionCookie(createSessionToken(username)));
    return res.json({ username });
}

export function getCurrentUser(req, res) {
    const user = readSession(req);

    if (!user) {
        throw new AppError(401, "Inicie sessão para continuar.");
    }

    return res.json(user);
}

export function logout(req, res) {
    res.setHeader("Set-Cookie", clearedSessionCookie());
    return res.status(204).end();
}
