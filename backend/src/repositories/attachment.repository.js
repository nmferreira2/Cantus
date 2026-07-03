import prisma from "../config/prisma.js";

export async function createAttachment(data, lyrics) {
    if (lyrics === null) {
        return prisma.songAttachment.create({ data });
    }

    const [, attachment] = await prisma.$transaction([
        prisma.song.update({
            where: { id: data.songId },
            data: { lyrics }
        }),
        prisma.songAttachment.create({ data })
    ]);

    return attachment;
}

export function getAttachment(songId, attachmentId) {
    return prisma.songAttachment.findFirst({
        where: {
            id: attachmentId,
            songId,
            deletedAt: null
        }
    });
}
