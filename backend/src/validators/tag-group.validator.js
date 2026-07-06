import { AppError } from "../utils/app-error.js";

export function validateTagGroup(req, res, next) {
    return validate(req, next, false);
}

export function validateTagGroupUpdate(req, res, next) {
    return validate(req, next, true);
}

function validate(req, next, partial) {
    try {
        const payload = req.body ?? {};
        const errors = {};
        const result = {};

        if (!partial || payload.name !== undefined) {
            if (typeof payload.name !== "string" || !payload.name.trim()) {
                errors.name = "O nome do grupo é obrigatório.";
            } else if (payload.name.trim().length > 100) {
                errors.name = "O nome do grupo deve ter no máximo 100 caracteres.";
            } else {
                result.name = payload.name.trim();
            }
        }

        if (payload.sortOrder !== undefined) {
            const sortOrder = Number(payload.sortOrder);
            if (!Number.isInteger(sortOrder) || sortOrder < 0) {
                errors.sortOrder = "A ordem deve ser um número inteiro positivo.";
            } else {
                result.sortOrder = sortOrder;
            }
        } else if (!partial) {
            result.sortOrder = 0;
        }

        if (partial && payload.active !== undefined) {
            if (typeof payload.active !== "boolean") {
                errors.active = "O estado do grupo é inválido.";
            } else {
                result.active = payload.active;
            }
        }

        if (Object.keys(errors).length > 0) {
            throw new AppError(
                422,
                "Não foi possível validar o grupo de tags.",
                errors
            );
        }
        if (partial && Object.keys(result).length === 0) {
            throw new AppError(422, "Indique pelo menos uma alteração.");
        }

        req.validatedBody = result;
        return next();
    } catch (error) {
        return next(error);
    }
}
