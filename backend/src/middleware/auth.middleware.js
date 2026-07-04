import { readSession } from "../utils/auth.config.js";
import { AppError } from "../utils/app-error.js";

export function requireAuthentication(req, res, next) {
    const user = readSession(req);

    if (!user) {
        return next(new AppError(401, "Inicie sessão para continuar."));
    }

    req.user = user;
    return next();
}
