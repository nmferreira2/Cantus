import { AppError } from "../utils/app-error.js";
import {
    CONTRIBUTOR_FIELDS,
    CONTRIBUTOR_ROLES
} from "../utils/contributor.constants.js";

export function validateContributor(req, res, next) {
    try {
        req.validatedBody = parseContributor(req.body);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function validateContributorQuery(req, res, next) {
    try {
        req.validatedQuery = parseContributorQuery(req.query);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseContributor(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto JSON.");
    }

    const unsupported = Object.keys(payload).filter(
        (field) => !CONTRIBUTOR_FIELDS.includes(field)
    );
    if (unsupported.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unsupported
        });
    }

    const errors = {};
    const name = text(payload.name, "name", 100, true, errors);
    const surname = text(payload.surname, "surname", 100, false, errors);
    const displayName = text(
        payload.displayName ?? [name, surname].filter(Boolean).join(" "),
        "displayName",
        200,
        true,
        errors
    );
    const role = payload.role ?? "MUSICIAN";
    const email = text(payload.email, "email", 200, false, errors);
    const phone = text(payload.phone, "phone", 50, false, errors);
    const notes = text(payload.notes, "notes", 20_000, false, errors);

    if (!CONTRIBUTOR_ROLES.includes(role)) {
        errors.role = "A função do contribuidor é inválida.";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "O endereço de email é inválido.";
    }

    const active = payload.active ?? true;
    if (typeof active !== "boolean") {
        errors.active = "O estado ativo deve ser verdadeiro ou falso.";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(422, "Não foi possível validar o contribuidor.", errors);
    }

    return {
        name,
        surname,
        displayName,
        role,
        email,
        phone,
        notes,
        active
    };
}

export function parseContributorQuery(query = {}) {
    const errors = {};
    const parsed = {
        search: text(query.search, "search", 100, false, errors) ?? "",
        page: integer(query.page, 1, 1, Number.MAX_SAFE_INTEGER, "page", errors),
        pageSize: integer(query.pageSize, 10, 1, 100, "pageSize", errors),
        sortBy: query.sortBy ?? "displayName",
        sortOrder: query.sortOrder ?? "asc",
        role: query.role ?? "",
        status: query.status ?? "current"
    };

    if (!["displayName", "role", "createdAt", "updatedAt"].includes(parsed.sortBy)) {
        errors.sortBy = "O campo de ordenação é inválido.";
    }
    if (!["asc", "desc"].includes(parsed.sortOrder)) {
        errors.sortOrder = "A ordem deve ser asc ou desc.";
    }
    if (parsed.role && !CONTRIBUTOR_ROLES.includes(parsed.role)) {
        errors.role = "O filtro de função é inválido.";
    }
    if (!["current", "active", "inactive", "archived"].includes(parsed.status)) {
        errors.status = "O filtro de estado é inválido.";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "A pesquisa de contribuidores é inválida.", errors);
    }

    return parsed;
}

function text(value, field, maximum, required, errors) {
    if (value === undefined || value === null || value === "") {
        if (required) {
            errors[field] = `${label(field)} é obrigatório.`;
            return "";
        }
        return null;
    }
    if (typeof value !== "string") {
        errors[field] = `${label(field)} deve ser texto.`;
        return null;
    }
    const normalized = value.trim();
    if (required && !normalized) {
        errors[field] = `${label(field)} é obrigatório.`;
    }
    if (normalized.length > maximum) {
        errors[field] = `${label(field)} deve ter no máximo ${maximum} caracteres.`;
    }
    return normalized || null;
}

function integer(value, fallback, minimum, maximum, field, errors) {
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

function label(field) {
    return {
        name: "O nome",
        surname: "O apelido",
        displayName: "O nome de apresentação",
        email: "O email",
        phone: "O telefone",
        notes: "As observações"
    }[field] ?? field;
}
