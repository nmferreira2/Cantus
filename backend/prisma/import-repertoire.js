import "dotenv/config";

import prisma from "../src/config/prisma.js";
import repertoire from "./repertoire/batch-02.js";

validateRepertoire(repertoire);

try {
    for (const item of repertoire) {
        const {
            songTypes,
            tagIds = [],
            ...song
        } = item;
        const createRelations = {
            types: {
                create: songTypes.map((type) => ({ type }))
            },
            tagLinks: {
                create: tagIds.map((tagId) => ({ tagId }))
            }
        };
        const updateRelations = {
            types: {
                deleteMany: {},
                create: songTypes.map((type) => ({ type }))
            },
            tagLinks: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId }))
            }
        };

        await prisma.song.upsert({
            where: { id: song.id },
            update: {
                title: song.title,
                composerName: song.composerName,
                arrangerName: song.arrangerName,
                harmonizerName: song.harmonizerName,
                ...updateRelations
            },
            create: {
                ...song,
                active: true,
                ...createRelations
            }
        });
    }

    console.log(`${repertoire.length} cânticos importados ou atualizados.`);
} finally {
    await prisma.$disconnect();
}

function validateRepertoire(items) {
    const ids = new Set();

    for (const item of items) {
        if (
            !item.id
            || !item.title
            || !item.composerName
            || !Array.isArray(item.songTypes)
            || item.songTypes.length === 0
        ) {
            throw new Error(`Registo de repertório inválido: ${JSON.stringify(item)}`);
        }
        if (ids.has(item.id)) {
            throw new Error(`Identificador de repertório duplicado: ${item.id}`);
        }
        ids.add(item.id);
    }
}
