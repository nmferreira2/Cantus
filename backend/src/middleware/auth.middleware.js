import * as authService from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { hasPermission } from "../utils/permissions.js";

export async function requireAuthentication(req, res, next) {
    try {
        const user = await authService.getAuthenticatedUser(req);
        if (!user) {
            return next(new AppError(401, "Inicie sessão para continuar."));
        }
        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
}

export function requirePermission(permission) {
    return (req, res, next) => {
        if (!hasPermission(req.user, permission)) {
            return next(new AppError(
                403,
                "Não tem permissão para realizar esta ação."
            ));
        }
        return next();
    };
}

export function requireOwnContributorOrPermission(permission) {
    return (req, res, next) => {
        if (
            hasPermission(req.user, permission)
            || req.user.contributorId === req.params.id
        ) {
            return next();
        }
        return next(new AppError(
            403,
            "Não tem permissão para consultar este contribuidor."
        ));
    };
}

export function requirePermissionForArchived(permission) {
    return (req, res, next) => {
        if (
            req.query.status !== "archived"
            || hasPermission(req.user, permission)
        ) {
            return next();
        }
        return next(new AppError(
            403,
            "Não tem permissão para consultar o arquivo."
        ));
    };
}
