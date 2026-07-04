import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

process.env.AUTH_USERNAME = "test-admin";
process.env.AUTH_PASSWORD = "test-password";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-32-characters";

const { default: app } = await import("../src/app.js");

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

    const protectedResponse = await fetch(`http://127.0.0.1:${port}/api/tags`);
    assert.equal(protectedResponse.status, 401);

    const invalidLogin = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "test-admin",
            password: "incorreta"
        })
    });
    assert.equal(invalidLogin.status, 401);

    const loginResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "test-admin",
            password: "test-password"
        })
    });
    assert.equal(loginResponse.status, 200);
    assert.deepEqual(await loginResponse.json(), { username: "test-admin" });
    const cookie = loginResponse.headers.get("set-cookie").split(";")[0];

    const currentUserResponse = await fetch(
        `http://127.0.0.1:${port}/api/auth/me`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(currentUserResponse.status, 200);
    assert.deepEqual(await currentUserResponse.json(), { username: "test-admin" });

    const invalidSessionResponse = await fetch(
        `http://127.0.0.1:${port}/api/auth/me`,
        { headers: { Cookie: `${cookie}alterada` } }
    );
    assert.equal(invalidSessionResponse.status, 401);

    const missingResponse = await fetch(
        `http://127.0.0.1:${port}/api/not-a-route`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(missingResponse.status, 404);
    assert.match(
        (await missingResponse.json()).error.message,
        /Rota da API não encontrada/
    );

    const logoutResponse = await fetch(
        `http://127.0.0.1:${port}/api/auth/logout`,
        { method: "POST", headers: { Cookie: cookie } }
    );
    assert.equal(logoutResponse.status, 204);
    assert.match(logoutResponse.headers.get("set-cookie"), /Max-Age=0/);
});

test("tags API is available and songs require a composer", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve) => server.close(resolve)));

    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api`;

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "test-admin",
            password: "test-password"
        })
    });
    const cookie = loginResponse.headers.get("set-cookie").split(";")[0];

    const tagsResponse = await fetch(`${baseUrl}/tags`, {
        headers: { Cookie: cookie }
    });
    assert.equal(tagsResponse.status, 200);
    const tags = await tagsResponse.json();
    assert.ok(Array.isArray(tags));
    assert.ok(tags.some(({ name }) => name === "Tempo do Advento"));
    assert.ok(tags.some(({ name }) => name === "Missas para Diversas Circunstâncias"));
    assert.ok(tags.some(({ name }) => name === "Via-Sacra"));

    const songResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie
        },
        body: JSON.stringify({
            title: "Cântico sem compositor",
            songTypes: ["OTHER"],
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

    const suffix = randomUUID();
    const title = `Cântico temporário ${suffix}`;
    const firstComposer = `Compositor A ${suffix}`;
    const secondComposer = `Compositor B ${suffix}`;
    const canonicalComposer = `Compositor unificado ${suffix}`;
    const createResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie
        },
        body: JSON.stringify({
            title,
            composerName: firstComposer,
            songTypes: ["ENTRANCE", "FINAL"],
            active: true,
            tagIds: []
        })
    });
    assert.equal(createResponse.status, 201);
    const song = await createResponse.json();
    assert.deepEqual(song.history, []);
    assert.deepEqual(song.scores, []);
    assert.deepEqual(
        new Set(song.songTypes),
        new Set(["ENTRANCE", "FINAL"])
    );

    const secondCreateResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie
        },
        body: JSON.stringify({
            title: `Segundo cântico temporário ${suffix}`,
            composerName: secondComposer,
            songTypes: ["OTHER"],
            active: true,
            tagIds: []
        })
    });
    assert.equal(secondCreateResponse.status, 201);
    const secondSong = await secondCreateResponse.json();

    const composersResponse = await fetch(`${baseUrl}/composers`, {
        headers: { Cookie: cookie }
    });
    assert.equal(composersResponse.status, 200);
    assert.ok((await composersResponse.json()).some(({ name }) => (
        name === firstComposer
    )));

    const mergeResponse = await fetch(`${baseUrl}/composers/merge`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie
        },
        body: JSON.stringify({
            sources: [firstComposer, secondComposer],
            name: canonicalComposer
        })
    });
    assert.equal(mergeResponse.status, 200);
    assert.equal((await mergeResponse.json()).updatedSongs, 2);

    const mergedSongResponse = await fetch(`${baseUrl}/songs/${song.id}`, {
        headers: { Cookie: cookie }
    });
    assert.equal(mergedSongResponse.status, 200);
    assert.equal(
        (await mergedSongResponse.json()).composerName,
        canonicalComposer
    );

    const finalSongsResponse = await fetch(
        `${baseUrl}/songs?songType=FINAL&search=${encodeURIComponent(title)}`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(finalSongsResponse.status, 200);
    assert.ok((await finalSongsResponse.json()).data.some(({ id }) => id === song.id));

    const searchResponse = await fetch(
        `${baseUrl}/search?q=${encodeURIComponent(title)}`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(searchResponse.status, 200);
    const searchSong = (await searchResponse.json()).results.songs
        .find(({ id }) => id === song.id);
    assert.deepEqual(
        new Set(searchSong.songTypes),
        new Set(["ENTRANCE", "FINAL"])
    );

    const statisticsResponse = await fetch(`${baseUrl}/statistics`, {
        headers: { Cookie: cookie }
    });
    assert.equal(statisticsResponse.status, 200);
    const statistics = await statisticsResponse.json();
    assert.ok(Array.isArray(statistics.charts.songsByType));
    assert.ok(Array.isArray(statistics.charts.songsByLiturgicalTime));
    assert.equal(statistics.charts.songsByLanguage, undefined);

    const prematureDeleteResponse = await fetch(
        `${baseUrl}/songs/${song.id}/permanent`,
        { method: "DELETE", headers: { Cookie: cookie } }
    );
    assert.equal(prematureDeleteResponse.status, 409);

    const archiveResponse = await fetch(`${baseUrl}/songs/${song.id}`, {
        method: "DELETE",
        headers: { Cookie: cookie }
    });
    assert.equal(archiveResponse.status, 204);

    const permanentDeleteResponse = await fetch(
        `${baseUrl}/songs/${song.id}/permanent`,
        { method: "DELETE", headers: { Cookie: cookie } }
    );
    assert.equal(permanentDeleteResponse.status, 204);

    const archiveSecondResponse = await fetch(
        `${baseUrl}/songs/${secondSong.id}`,
        { method: "DELETE", headers: { Cookie: cookie } }
    );
    assert.equal(archiveSecondResponse.status, 204);
    const deleteSecondResponse = await fetch(
        `${baseUrl}/songs/${secondSong.id}/permanent`,
        { method: "DELETE", headers: { Cookie: cookie } }
    );
    assert.equal(deleteSecondResponse.status, 204);
});
