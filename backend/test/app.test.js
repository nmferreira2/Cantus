import assert from "node:assert/strict";
import test from "node:test";

import app from "../src/app.js";

test("health endpoint and API fallback return JSON", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve) => server.close(resolve)));

    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();

    const healthResponse = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), {
        application: "Cantus",
        version: "1.0.0",
        status: "ok"
    });

    const missingResponse = await fetch(`http://127.0.0.1:${port}/api/not-a-route`);
    assert.equal(missingResponse.status, 404);
    assert.match(
        (await missingResponse.json()).error.message,
        /Rota da API não encontrada/
    );
});

test("tags API is available and songs require a composer", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve) => server.close(resolve)));

    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api`;

    const tagsResponse = await fetch(`${baseUrl}/tags`);
    assert.equal(tagsResponse.status, 200);
    const tags = await tagsResponse.json();
    assert.ok(Array.isArray(tags));
    assert.ok(tags.some(({ name }) => name === "Advento"));

    const songResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: "Cântico sem compositor",
            songType: "OTHER",
            active: true,
            tagIds: []
        })
    });
    assert.equal(songResponse.status, 422);
    const payload = await songResponse.json();
    assert.equal(
        payload.error.details.composerName,
        "O compositor é obrigatório."
    );
});
