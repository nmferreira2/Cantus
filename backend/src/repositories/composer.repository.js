import prisma from "../config/prisma.js";

export async function findAll() {
    const composers = await prisma.song.groupBy({
        by: ["composerName"],
        _count: { composerName: true },
        orderBy: { composerName: "asc" }
    });

    return composers.map(({ composerName, _count }) => ({
        name: composerName,
        songCount: _count.composerName
    }));
}

export function findNames(names) {
    return prisma.song.findMany({
        where: { composerName: { in: names } },
        distinct: ["composerName"],
        select: { composerName: true }
    });
}

export function mergeNames(sources, name) {
    return prisma.song.updateMany({
        where: { composerName: { in: sources } },
        data: { composerName: name }
    });
}
