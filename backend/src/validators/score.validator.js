import { AppError } from "../utils/app-error.js";
import { SCORE_FORMATS } from "../utils/score.constants.js";

export function validateScoreCreate(req, res, next) {
    try {
        req.validatedBody = parseScore(req.body, true);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function validateScoreUpdate(req, res, next) {
    try {
        req.validatedBody = parseScore(req.body, false);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function validateScoreQuery(req, res, next) {
    try {
        req.validatedQuery = parseScoreQuery(req.query);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseScore(payload, creating) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto.");
    }

    const allowed = creating
        ? ["songId", "title", "description", "active"]
        : ["title", "description", "active"];
    const unsupported = Object.keys(payload).filter((field) => !allowed.includes(field));
    if (unsupported.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unsupported
        });
    }

    const errors = {};
    const result = {
        ...(creating
            ? { songId: requiredText(payload.songId, "songId", 100, errors) }
            : {}),
        title: requiredText(payload.title, "title", 200, errors),
        description: optionalText(payload.description, "description", 2000, errors),
        active: parseBoolean(payload.active, true, errors)
    };

    if (Object.keys(errors).length > 0) {
        throw new AppError(422, "Não foi possível validar a partitura.", errors);
    }

    return result;
}

export function parseScoreQuery(query = {}) {
    const errors = {};
    const page = number(query.page, 1, 1, Number.MAX_SAFE_INTEGER, "page", errors);
    const pageSize = number(query.pageSize, 10, 1, 100, "pageSize", errors);
    const sortBy = query.sortBy ?? "updatedAt";
    const sortOrder = query.sortOrder ?? "desc";
    const format = query.format ?? "";
    const status = query.status ?? "current";

    if (!["title", "format", "createdAt", "updatedAt"].includes(sortBy)) {
        errors.sortBy = "O campo de ordenação é inválido.";
    }
    if (!["asc", "desc"].includes(sortOrder)) {
        errors.sortOrder = "A ordem é inválida.";
    }
    if (format && !SCORE_FORMATS.includes(format)) {
        errors.format = "O filtro de formato é inválido.";
    }
    if (!["current", "active", "inactive", "archived"].includes(status)) {
        errors.status = "O filtro de estado é inválido.";
    }
    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "A pesquisa de partituras é inválida.", errors);
    }

    return {
        search: typeof query.search === "string" ? query.search.trim().slice(0, 100) : "",
        songId: typeof query.songId === "string" ? query.songId : "",
        page,
        pageSize,
        sortBy,
        sortOrder,
        format,
        status
    };
}

function requiredText(value, field, maximum, errors) {
    if (typeof value !== "string" || !value.trim()) {
        errors[field] = `${fieldLabel(field)} é obrigatório.`;
        return "";
    }
    return limited(value, field, maximum, errors);
}

function optionalText(value, field, maximum, errors) {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    if (typeof value !== "string") {
        errors[field] = `${fieldLabel(field)} deve ser texto.`;
        return null;
    }
    return limited(value, field, maximum, errors);
}

function limited(value, field, maximum, errors) {
    const normalized = value.trim();
    if (normalized.length > maximum) {
        errors[field] = `${fieldLabel(field)} deve ter no máximo ${maximum} caracteres.`;
    }
    return normalized;
}

function parseBoolean(value, fallback, errors) {
    if (value === undefined) {
        return fallback;
    }
    if (value === true || value === "true") {
        return true;
    }
    if (value === false || value === "false") {
        return false;
    }
    errors.active = "O estado ativo deve ser verdadeiro ou falso.";
    return fallback;
}

function number(value, fallback, minimum, maximum, field, errors) {
    if (value === undefined || value === "") {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
        errors[field] = `${field} é inválido.`;
        return fallback;
    }
    return parsed;
}

function fieldLabel(field) {
    return {
        songId: "O cântico",
        title: "O título",
        description: "A descrição"
    }[field] ?? field;
}
