import prisma from "../config/prisma.js";

const groupSelection = {
    id: true,
    name: true,
    slug: true,
    sortOrder: true,
    active: true,
    deletedAt: true
};

export function getAllTags({ groupId, includeArchived = false } = {}) {
    return prisma.tag.findMany({
        where: {
            ...(groupId ? { groupId } : {}),
            ...(includeArchived
                ? {}
                : {
                    active: true,
                    deletedAt: null,
                    group: { active: true, deletedAt: null }
                })
        },
        include: { group: { select: groupSelection } },
        orderBy: [
            { group: { sortOrder: "asc" } },
            { group: { name: "asc" } },
            { sortOrder: "asc" },
            { name: "asc" }
        ]
    });
}

export function getTagById(id) {
    return prisma.tag.findUnique({
        where: { id },
        include: { group: { select: groupSelection } }
    });
}

export async function findByName(name, groupId, excludedId) {
    const candidates = await prisma.tag.findMany({
        where: {
            groupId,
            name: { contains: name },
            ...(excludedId ? { id: { not: excludedId } } : {})
        }
    });
    const normalized = name.toLocaleLowerCase("pt-PT");
    return candidates.find(
        (tag) => tag.name.toLocaleLowerCase("pt-PT") === normalized
    ) ?? null;
}

export function createTag(data) {
    return prisma.tag.create({
        data,
        include: { group: { select: groupSelection } }
    });
}

export function updateTag(id, data) {
    return prisma.tag.update({
        where: { id },
        data,
        include: { group: { select: groupSelection } }
    });
}

export function archiveTag(id) {
    return prisma.tag.update({
        where: { id },
        data: {
            active: false,
            deletedAt: new Date()
        },
        include: { group: { select: groupSelection } }
    });
}

export function countTagsByIds(ids) {
    return prisma.tag.count({
        where: {
            id: { in: ids }
        }
    });
}
