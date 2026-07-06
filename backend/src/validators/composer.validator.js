import { AppError } from "../utils/app-error.js";

export function validateComposerMerge(req, res, next) {
    try {
        req.validatedBody = parseComposerMerge(req.body);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function validateComposerProfile(req, res, next) {
    try {
        const payload = req.body ?? {};
        const unsupported = Object.keys(payload).filter(
            (field) => field !== "biography"
        );
        if (unsupported.length > 0) {
            throw new AppError(400, "O pedido contém campos não suportados.", {
                fields: unsupported
            });
        }
        if (
            payload.biography !== undefined
            && payload.biography !== null
            && typeof payload.biography !== "string"
        ) {
            throw new AppError(422, "A biografia deve ser texto.", {
                biography: "A biografia deve ser texto."
            });
        }
        const biography = payload.biography?.trim() || null;
        if (biography && biography.length > 20_000) {
            throw new AppError(422, "A biografia é demasiado longa.", {
                biography: "A biografia deve ter no máximo 20 000 caracteres."
            });
        }
        req.validatedBody = { biography };
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseComposerMerge(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto JSON.");
    }

    const unsupported = Object.keys(payload).filter(
        (field) => !["sources", "name"].includes(field)
    );
    if (unsupported.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unsupported
        });
    }

    const errors = {};
    const sources = normalizeSources(payload.sources, errors);
    const name = normalizeName(payload.name, errors);

    if (Object.keys(errors).length > 0) {
        throw new AppError(
            422,
            "Não foi possível validar os compositores.",
            errors
        );
    }

    return { sources, name };
}

function normalizeSources(value, errors) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.sources = "Selecione pelo menos um nome de compositor.";
        return [];
    }

    const invalid = value.some((item) => (
        typeof item !== "string"
        || !item.trim()
        || item.trim().length > 200
    ));
    if (invalid) {
        errors.sources = "Os nomes selecionados são inválidos.";
        return [];
    }

    return [...new Set(value.map((item) => item.trim()))];
}

function normalizeName(value, errors) {
    if (typeof value !== "string" || !value.trim()) {
        errors.name = "O nome final do compositor é obrigatório.";
        return "";
    }

    const name = value.trim();
    if (name.length > 200) {
        errors.name = "O nome final deve ter no máximo 200 caracteres.";
    }
    return name;
}
