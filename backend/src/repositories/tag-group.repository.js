import prisma from "../config/prisma.js";

export function getAllTagGroups({ includeArchived = false } = {}) {
    return prisma.tagGroup.findMany({
        where: includeArchived
            ? {}
            : { active: true, deletedAt: null },
        include: {
            tags: {
                where: includeArchived
                    ? {}
                    : { active: true, deletedAt: null },
                orderBy: [
                    { sortOrder: "asc" },
                    { name: "asc" }
                ]
            },
            _count: { select: { tags: true } }
        },
        orderBy: [
            { sortOrder: "asc" },
            { name: "asc" }
        ]
    });
}

export function getTagGroupById(id) {
    return prisma.tagGroup.findUnique({
        where: { id },
        include: { _count: { select: { tags: true } } }
    });
}

export async function findTagGroupByName(name, excludedId) {
    const candidates = await prisma.tagGroup.findMany({
        where: {
            name: { contains: name },
            ...(excludedId ? { id: { not: excludedId } } : {})
        }
    });
    const normalized = name.toLocaleLowerCase("pt-PT");
    return candidates.find(
        (group) => group.name.toLocaleLowerCase("pt-PT") === normalized
    ) ?? null;
}

export function createTagGroup(data) {
    return prisma.tagGroup.create({
        data,
        include: {
            tags: true,
            _count: { select: { tags: true } }
        }
    });
}

export function updateTagGroup(id, data) {
    return prisma.tagGroup.update({
        where: { id },
        data,
        include: {
            tags: {
                orderBy: [
                    { sortOrder: "asc" },
                    { name: "asc" }
                ]
            },
            _count: { select: { tags: true } }
        }
    });
}

export function archiveTagGroup(id) {
    return prisma.tagGroup.update({
        where: { id },
        data: {
            active: false,
            deletedAt: new Date()
        },
        include: {
            tags: true,
            _count: { select: { tags: true } }
        }
    });
}
