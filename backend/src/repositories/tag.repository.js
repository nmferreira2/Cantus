import prisma from "../config/prisma.js";

export function getAllTags() {
    return prisma.tag.findMany({
        orderBy: [
            { group: "asc" },
            { name: "asc" }
        ]
    });
}

export async function findByName(name) {
    const candidates = await prisma.tag.findMany({
        where: { name: { contains: name } }
    });
    const normalized = name.toLocaleLowerCase("pt-PT");
    return candidates.find(
        (tag) => tag.name.toLocaleLowerCase("pt-PT") === normalized
    ) ?? null;
}

export function createTag(data) {
    return prisma.tag.create({ data });
}

export function countTagsByIds(ids) {
    return prisma.tag.count({
        where: {
            id: { in: ids }
        }
    });
}
