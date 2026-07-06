import prisma from "../config/prisma.js";

const contributorSelection = {
    id: true,
    name: true,
    surname: true,
    displayName: true
};

export function findAll() {
    return prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { username: "asc" },
        select: {
            id: true,
            username: true,
            role: true,
            contributorId: true,
            allowScoreManagement: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            contributor: { select: contributorSelection }
        }
    });
}

export function findById(id, includeArchived = false) {
    return prisma.user.findFirst({
        where: {
            id,
            ...(includeArchived ? {} : { deletedAt: null })
        },
        include: { contributor: { select: contributorSelection } }
    });
}

export function findByUsername(username) {
    return prisma.user.findUnique({
        where: { username },
        include: { contributor: { select: contributorSelection } }
    });
}

export function countContributor(id) {
    return prisma.contributor.count({
        where: { id, deletedAt: null, active: true }
    });
}

export function create(data) {
    return prisma.user.create({
        data,
        include: { contributor: { select: contributorSelection } }
    });
}

export function update(id, data) {
    return prisma.user.update({
        where: { id },
        data,
        include: { contributor: { select: contributorSelection } }
    });
}

export function archive(id) {
    return prisma.user.update({
        where: { id },
        data: {
            active: false,
            deletedAt: new Date()
        }
    });
}
