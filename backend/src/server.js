import "dotenv/config";

import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Cantus is running at http://localhost:${PORT}`);
});

async function shutdown(signal) {
    console.log(`${signal} received. Shutting down gracefully.`);

    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
