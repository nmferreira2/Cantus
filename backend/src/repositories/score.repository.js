import prisma from "../config/prisma.js";

const scoreInclude = {
    song: {
        select: { id: true, title: true }
    },
    versions: {
        orderBy: { versionNumber: "desc" }
    }
};

export async function findAll(query) {
    const where = scoreWhere(query);
    const [data, total] = await prisma.$transaction([
        prisma.score.findMany({
            where,
            orderBy: [
                { [query.sortBy]: query.sortOrder },
                ...(query.sortBy === "title" ? [] : [{ title: "asc" }])
            ],
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize,
            include: {
                song: { select: { id: true, title: true } },
                versions: {
                    orderBy: { versionNumber: "desc" },
                    take: 1
                },
                _count: { select: { versions: true } }
            }
        }),
        prisma.score.count({ where })
    ]);
    return {
        data: data.map(({ _count, versions, ...score }) => ({
            ...score,
            versionCount: _count.versions,
            latestVersion: versions[0] ?? null
        })),
        total
    };
}

export function findById(id, includeArchived = false) {
    return prisma.score.findFirst({
        where: {
            id,
            ...(includeArchived ? {} : { deletedAt: null })
        },
        include: scoreInclude
    });
}

export function createWithVersion(scoreData, versionData) {
    return prisma.score.create({
        data: {
            ...scoreData,
            versions: {
                create: {
                    ...versionData,
                    versionNumber: 1
                }
            }
        },
        include: scoreInclude
    });
}

export function update(id, data) {
    return prisma.score.update({
        where: { id },
        data,
        include: scoreInclude
    });
}

export function addVersion(scoreId, data) {
    return prisma.$transaction(async (transaction) => {
        const aggregate = await transaction.scoreVersion.aggregate({
            where: { scoreId },
            _max: { versionNumber: true }
        });
        const version = await transaction.scoreVersion.create({
            data: {
                ...data,
                scoreId,
                versionNumber: (aggregate._max.versionNumber ?? 0) + 1
            }
        });
        await transaction.score.update({
            where: { id: scoreId },
            data: { updatedAt: new Date() }
        });
        return version;
    });
}

export function findVersion(scoreId, versionId) {
    return prisma.scoreVersion.findFirst({
        where: {
            id: versionId,
            scoreId
        }
    });
}

export function archive(id) {
    return prisma.score.update({
        where: { id },
        data: { active: false, deletedAt: new Date() }
    });
}

export function restore(id) {
    return prisma.score.update({
        where: { id },
        data: { active: true, deletedAt: null },
        include: scoreInclude
    });
}

function scoreWhere(query) {
    const archived = query.status === "archived";
    return {
        deletedAt: archived ? { not: null } : null,
        ...(query.status === "active" ? { active: true } : {}),
        ...(query.status === "inactive" ? { active: false } : {}),
        ...(query.songId ? { songId: query.songId } : {}),
        ...(query.format ? { format: query.format } : {}),
        ...(query.search
            ? {
                OR: [
                    { title: { contains: query.search } },
                    { description: { contains: query.search } },
                    { song: { title: { contains: query.search } } }
                ]
            }
            : {})
    };
}
