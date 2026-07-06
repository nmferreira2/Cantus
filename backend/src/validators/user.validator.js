import { AppError } from "../utils/app-error.js";

export function validateUserCreate(req, res, next) {
    return validate(req, next, true);
}

export function validateUserUpdate(req, res, next) {
    return validate(req, next, false);
}

function validate(req, next, creating) {
    try {
        req.validatedBody = parseUser(req.body, creating);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseUser(payload, creating = true) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto JSON.");
    }

    const allowed = [
        "username",
        "password",
        "role",
        "contributorId",
        "allowScoreManagement",
        "active"
    ];
    const unsupported = Object.keys(payload).filter(
        (field) => !allowed.includes(field)
    );
    if (unsupported.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unsupported
        });
    }

    const errors = {};
    const username = requiredText(payload.username, "username", 100, errors);
    const password = optionalPassword(payload.password, creating, errors);
    const role = payload.role ?? "CONTRIBUTOR";
    const contributorId = optionalText(
        payload.contributorId,
        "contributorId",
        100,
        errors
    );
    const allowScoreManagement = boolean(
        payload.allowScoreManagement,
        false,
        "allowScoreManagement",
        errors
    );
    const active = boolean(payload.active, true, "active", errors);

    if (!["ADMIN", "CONTRIBUTOR"].includes(role)) {
        errors.role = "A função do utilizador é inválida.";
    }
    if (role === "CONTRIBUTOR" && !contributorId) {
        errors.contributorId = "Selecione o contribuidor associado.";
    }
    if (Object.keys(errors).length > 0) {
        throw new AppError(422, "Não foi possível validar o utilizador.", errors);
    }

    return {
        username,
        password,
        role,
        contributorId,
        allowScoreManagement,
        active
    };
}

function requiredText(value, field, maximum, errors) {
    if (typeof value !== "string" || !value.trim()) {
        errors[field] = "O nome de utilizador é obrigatório.";
        return "";
    }
    return limit(value, field, maximum, errors);
}

function optionalText(value, field, maximum, errors) {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    if (typeof value !== "string") {
        errors[field] = "O valor selecionado é inválido.";
        return null;
    }
    return limit(value, field, maximum, errors);
}

function optionalPassword(value, required, errors) {
    if (value === undefined || value === "") {
        if (required) {
            errors.password = "A palavra-passe é obrigatória.";
        }
        return null;
    }
    if (typeof value !== "string" || value.length < 8 || value.length > 200) {
        errors.password = "A palavra-passe deve ter entre 8 e 200 caracteres.";
        return null;
    }
    return value;
}

function boolean(value, fallback, field, errors) {
    if (value === undefined) {
        return fallback;
    }
    if (typeof value !== "boolean") {
        errors[field] = "O valor deve ser verdadeiro ou falso.";
        return fallback;
    }
    return value;
}

function limit(value, field, maximum, errors) {
    const normalized = value.trim();
    if (normalized.length > maximum) {
        errors[field] = `O valor deve ter no máximo ${maximum} caracteres.`;
    }
    return normalized;
}
