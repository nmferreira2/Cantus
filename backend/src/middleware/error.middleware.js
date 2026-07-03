import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error.js";

export function apiNotFound(req, res) {
    return res.status(404).json({
        error: {
            message: `Rota da API não encontrada: ${req.method} ${req.originalUrl}`
        }
    });
}

export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const normalizedError = normalizeError(error);

    if (normalizedError.status >= 500) {
        console.error(error);
    }

    return res.status(normalizedError.status).json({
        error: {
            message: normalizedError.message,
            ...(normalizedError.details ? { details: normalizedError.details } : {})
        }
    });
}

function normalizeError(error) {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return new AppError(400, "O corpo do pedido contém JSON inválido.");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
            return new AppError(404, "Cântico não encontrado.");
        }

        if (error.code === "P2002") {
            return new AppError(409, "Já existe um cântico com este título.");
        }
    }

    return new AppError(500, "Ocorreu um erro inesperado.");
}
