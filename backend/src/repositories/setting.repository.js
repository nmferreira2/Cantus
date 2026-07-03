import prisma from "../config/prisma.js";

export function get() {
    return prisma.appSetting.findUnique({ where: { id: 1 } });
}

export function update(data) {
    return prisma.appSetting.upsert({
        where: { id: 1 },
        create: { id: 1, ...data },
        update: data
    });
}

export function updateLogo(logoPath) {
    return prisma.appSetting.upsert({
        where: { id: 1 },
        create: { id: 1, logoPath },
        update: { logoPath }
    });
}
