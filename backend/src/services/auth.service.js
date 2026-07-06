import * as userRepository from "../repositories/user.repository.js";
import {
    authenticateCredentials,
    createSessionToken,
    environmentAdminUsername,
    readSession
} from "../utils/auth.config.js";
import { AppError } from "../utils/app-error.js";
import { verifyPassword } from "../utils/password.js";
import { permissionsFor } from "../utils/permissions.js";
import { presentUser } from "./user.service.js";

export async function login(username, password) {
    if (authenticateCredentials(username, password)) {
        const user = environmentAdmin();
        return {
            user,
            token: createSessionToken(user)
        };
    }

    const stored = await userRepository.findByUsername(username);
    if (
        !stored
        || stored.deletedAt
        || !stored.active
        || !await verifyPassword(password, stored.passwordHash)
    ) {
        throw new AppError(401, "Utilizador ou palavra-passe incorretos.");
    }

    const user = presentUser(stored);
    return {
        user,
        token: createSessionToken(user)
    };
}

export async function getAuthenticatedUser(req) {
    const session = readSession(req);
    if (!session) {
        return null;
    }

    if (
        session.uid === null
        && session.role === "ADMIN"
        && session.sub === environmentAdminUsername()
    ) {
        return environmentAdmin();
    }

    if (typeof session.uid !== "string") {
        return null;
    }
    const stored = await userRepository.findById(session.uid);
    if (
        !stored
        || !stored.active
        || stored.username !== session.sub
    ) {
        return null;
    }
    return presentUser(stored);
}

function environmentAdmin() {
    const user = {
        id: null,
        username: environmentAdminUsername(),
        role: "ADMIN",
        contributorId: null,
        contributor: null,
        allowScoreManagement: true,
        active: true
    };
    return {
        ...user,
        permissions: permissionsFor(user)
    };
}
