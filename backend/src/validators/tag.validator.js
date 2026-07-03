import { AppError } from "../utils/app-error.js";

export function validateTag(req, res, next) {
    try {
        const { name, category } = req.body ?? {};
        const errors = {};

        if (typeof name !== "string" || !name.trim()) {
            errors.name = "O nome da tag é obrigatório.";
        } else if (name.trim().length > 100) {
            errors.name = "O nome da tag deve ter no máximo 100 caracteres.";
        }

        if (
            category !== undefined
            && category !== null
            && typeof category !== "string"
        ) {
            errors.category = "A categoria deve ser texto.";
        }

        if (Object.keys(errors).length > 0) {
            throw new AppError(422, "Não foi possível validar a tag.", errors);
        }

        req.validatedBody = {
            name: name.trim(),
            category: typeof category === "string" && category.trim()
                ? category.trim().slice(0, 100)
                : null
        };
        return next();
    } catch (error) {
        return next(error);
    }
}
