import * as repository from "../repositories/contributor.repository.js";
import { AppError } from "../utils/app-error.js";
import { paginatedResponse } from "../utils/pagination.js";

export async function getContributors(query) {
    const result = await repository.findAll(query);
    const response = paginatedResponse(result.data, result.total, query);

    if (response.pagination.page !== query.page && result.total > 0) {
        return getContributors({ ...query, page: response.pagination.page });
    }

    return response;
}

export async function getContributor(id) {
    const contributor = await repository.findById(id);
    if (!contributor) {
        throw new AppError(404, "Contribuidor não encontrado.");
    }
    return contributor;
}

export function createContributor(data) {
    return repository.create(data);
}

export async function updateContributor(id, data) {
    await getContributor(id);
    return repository.update(id, data);
}

export async function archiveContributor(id) {
    await getContributor(id);
    return repository.archive(id);
}

export async function restoreContributor(id) {
    const contributor = await repository.findById(id, true);
    if (!contributor) {
        throw new AppError(404, "Contribuidor não encontrado.");
    }
    if (!contributor.deletedAt) {
        throw new AppError(409, "O contribuidor não está arquivado.");
    }
    return repository.restore(id);
}
