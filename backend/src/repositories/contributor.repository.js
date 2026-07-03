import prisma from "../config/prisma.js";

export async function findAll(query) {
    const where = contributorWhere(query);
    const [data, total] = await prisma.$transaction([
        prisma.contributor.findMany({
            where,
            orderBy: [
                { [query.sortBy]: query.sortOrder },
                ...(query.sortBy === "displayName" ? [] : [{ displayName: "asc" }])
            ],
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize
        }),
        prisma.contributor.count({ where })
    ]);
    return { data, total };
}

export function findById(id, includeArchived = false) {
    return prisma.contributor.findFirst({
        where: {
            id,
            ...(includeArchived ? {} : { deletedAt: null })
        }
    });
}

export function create(data) {
    return prisma.contributor.create({ data });
}

export function update(id, data) {
    return prisma.contributor.update({
        where: { id },
        data
    });
}

export function archive(id) {
    return prisma.contributor.update({
        where: { id },
        data: { active: false, deletedAt: new Date() }
    });
}

export function restore(id) {
    return prisma.contributor.update({
        where: { id },
        data: { active: true, deletedAt: null }
    });
}

function contributorWhere(query) {
    const archived = query.status === "archived";
    return {
        deletedAt: archived ? { not: null } : null,
        ...(query.status === "active" ? { active: true } : {}),
        ...(query.status === "inactive" ? { active: false } : {}),
        ...(query.role ? { role: query.role } : {}),
        ...(query.search
            ? {
                OR: [
                    { name: { contains: query.search } },
                    { surname: { contains: query.search } },
                    { displayName: { contains: query.search } },
                    { email: { contains: query.search } }
                ]
            }
            : {})
    };
}
