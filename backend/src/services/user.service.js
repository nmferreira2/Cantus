import * as repository from "../repositories/user.repository.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword } from "../utils/password.js";
import { permissionsFor } from "../utils/permissions.js";

export async function getUsers() {
    return (await repository.findAll()).map(presentUser);
}

export async function getUser(id) {
    const user = await repository.findById(id);
    if (!user) {
        throw new AppError(404, "Utilizador não encontrado.");
    }
    return presentUser(user);
}

export async function createUser(data) {
    await ensureUsernameAvailable(data.username);
    await ensureContributor(data);
    const { password, ...userData } = normalizeRoleData(data);
    const user = await repository.create({
        ...userData,
        passwordHash: await hashPassword(password)
    });
    return presentUser(user);
}

export async function updateUser(id, data) {
    const existing = await repository.findById(id);
    if (!existing) {
        throw new AppError(404, "Utilizador não encontrado.");
    }
    await ensureUsernameAvailable(data.username, id);
    await ensureContributor(data);

    const { password, ...userData } = normalizeRoleData(data);
    const user = await repository.update(id, {
        ...userData,
        ...(password ? { passwordHash: await hashPassword(password) } : {})
    });
    return presentUser(user);
}

export async function archiveUser(id, actor) {
    if (actor.id === id) {
        throw new AppError(409, "Não pode arquivar a sua própria conta.");
    }
    const user = await repository.findById(id);
    if (!user) {
        throw new AppError(404, "Utilizador não encontrado.");
    }
    await repository.archive(id);
}

export function presentUser(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        contributorId: user.contributorId,
        contributor: user.contributor ?? null,
        allowScoreManagement: user.allowScoreManagement,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: permissionsFor(user)
    };
}

async function ensureUsernameAvailable(username, excludedId) {
    const existing = await repository.findByUsername(username);
    if (existing && existing.id !== excludedId) {
        throw new AppError(409, "Já existe um utilizador com este nome.", {
            username: "Escolha outro nome de utilizador."
        });
    }
}

async function ensureContributor(data) {
    if (data.role !== "CONTRIBUTOR" || !data.contributorId) {
        return;
    }
    if (await repository.countContributor(data.contributorId) !== 1) {
        throw new AppError(422, "O contribuidor selecionado não existe.", {
            contributorId: "Selecione um contribuidor válido."
        });
    }
}

function normalizeRoleData(data) {
    return data.role === "ADMIN"
        ? {
            ...data,
            contributorId: null,
            allowScoreManagement: false
        }
        : data;
}
