import { AppError } from "../utils/app-error.js";

const FIELDS = [
    "applicationName",
    "primaryColor",
    "secondaryColor",
    "churchName",
    "churchAddress",
    "churchEmail",
    "churchPhone",
    "defaultLanguage"
];

export function validateSettings(req, res, next) {
    try {
        req.validatedBody = parseSettings(req.body);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseSettings(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto.");
    }
    const unsupported = Object.keys(payload).filter((field) => !FIELDS.includes(field));
    if (unsupported.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unsupported
        });
    }
    const errors = {};
    const settings = {
        applicationName: required(payload.applicationName, "applicationName", 100, errors),
        primaryColor: color(payload.primaryColor, "primaryColor", errors),
        secondaryColor: color(payload.secondaryColor, "secondaryColor", errors),
        churchName: optional(payload.churchName, "churchName", 200, errors),
        churchAddress: optional(payload.churchAddress, "churchAddress", 1000, errors),
        churchEmail: optional(payload.churchEmail, "churchEmail", 200, errors),
        churchPhone: optional(payload.churchPhone, "churchPhone", 50, errors),
        defaultLanguage: required(payload.defaultLanguage, "defaultLanguage", 80, errors)
    };

    if (
        settings.churchEmail
        && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.churchEmail)
    ) {
        errors.churchEmail = "O email da igreja é inválido.";
    }
    if (Object.keys(errors).length > 0) {
        throw new AppError(422, "Não foi possível validar as definições.", errors);
    }
    return settings;
}

function required(value, field, maximum, errors) {
    if (typeof value !== "string" || !value.trim()) {
        errors[field] = `${fieldLabel(field)} é obrigatório.`;
        return "";
    }
    return optional(value, field, maximum, errors);
}

function optional(value, field, maximum, errors) {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    if (typeof value !== "string") {
        errors[field] = `${fieldLabel(field)} deve ser texto.`;
        return null;
    }
    const normalized = value.trim();
    if (normalized.length > maximum) {
        errors[field] = `${fieldLabel(field)} deve ter no máximo ${maximum} caracteres.`;
    }
    return normalized || null;
}

function color(value, field, errors) {
    if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) {
        errors[field] = `${fieldLabel(field)} deve ser uma cor hexadecimal com seis dígitos.`;
        return "#000000";
    }
    return value.toLocaleLowerCase();
}

function fieldLabel(field) {
    return {
        applicationName: "O nome da aplicação",
        primaryColor: "A cor principal",
        secondaryColor: "A cor secundária",
        churchName: "O nome da igreja",
        churchAddress: "A morada da igreja",
        churchEmail: "O email da igreja",
        churchPhone: "O telefone da igreja",
        defaultLanguage: "O idioma predefinido"
    }[field] ?? field;
}
