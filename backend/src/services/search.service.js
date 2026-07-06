import * as repository from "../repositories/search.repository.js";
import { AppError } from "../utils/app-error.js";

export async function search(query, user) {
    if (typeof query !== "string" || query.trim().length < 2) {
        throw new AppError(400, "A pesquisa deve conter pelo menos 2 caracteres.");
    }
    return {
        query: query.trim().slice(0, 100),
        results: await repository.globalSearch(
            query.trim().slice(0, 100),
            5,
            user.role === "ADMIN"
        )
    };
}
