import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PDFDocument } from "pdf-lib";

process.env.AUTH_USERNAME = "test-admin";
process.env.AUTH_PASSWORD = "test-password";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-32-characters";

const { default: app } = await import("../src/app.js");
const { default: prisma } = await import("../src/config/prisma.js");
const fileRepository = await import("../src/repositories/file.repository.js");

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
    const loggedIn = await loginResponse.json();
    assert.equal(loggedIn.username, "test-admin");
    assert.equal(loggedIn.role, "ADMIN");
    assert.ok(loggedIn.permissions.includes("MANAGE_USERS"));
    const cookie = loginResponse.headers.get("set-cookie").split(";")[0];

    const currentUserResponse = await fetch(
        `http://127.0.0.1:${port}/api/auth/me`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(currentUserResponse.status, 200);
    const currentUser = await currentUserResponse.json();
    assert.equal(currentUser.username, "test-admin");
    assert.equal(currentUser.role, "ADMIN");

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
    const composerDetailResponse = await fetch(
        `${baseUrl}/composers/${encodeURIComponent(canonicalComposer)}`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(composerDetailResponse.status, 200);
    assert.equal((await composerDetailResponse.json()).songs.length, 2);

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

test("permissions, score categories, soft deletion and celebration PDF", async (context) => {
    const server = app.listen(0);
    const created = {
        contributorId: null,
        userId: null,
        songId: null,
        massId: null
    };
    context.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        const scores = created.songId
            ? await prisma.score.findMany({
                where: { songId: created.songId },
                include: { versions: true }
            })
            : [];
        if (created.massId) {
            await prisma.mass.deleteMany({ where: { id: created.massId } });
        }
        if (created.userId) {
            await prisma.user.deleteMany({ where: { id: created.userId } });
        }
        if (created.songId) {
            await prisma.score.deleteMany({ where: { songId: created.songId } });
            await prisma.song.deleteMany({ where: { id: created.songId } });
        }
        if (created.contributorId) {
            await prisma.contributor.deleteMany({
                where: { id: created.contributorId }
            });
        }
        await Promise.all(scores.flatMap(({ versions }) => (
            versions.map(({ relativePath }) => (
                fileRepository.removeFile(relativePath)
            ))
        )));
    });

    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const adminCookie = await loginCookie(baseUrl, "test-admin", "test-password");
    const suffix = randomUUID();
    const displayName = `Compositor restrito ${suffix}`;

    const contributorResponse = await fetch(`${baseUrl}/contributors`, {
        method: "POST",
        headers: jsonHeaders(adminCookie),
        body: JSON.stringify({
            name: displayName,
            displayName,
            role: "COMPOSER",
            active: true
        })
    });
    assert.equal(contributorResponse.status, 201);
    const contributor = await contributorResponse.json();
    created.contributorId = contributor.id;

    const songResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: jsonHeaders(adminCookie),
        body: JSON.stringify({
            title: `Cântico de permissões ${suffix}`,
            composerName: displayName,
            songTypes: ["ENTRANCE"],
            tagIds: [],
            active: true
        })
    });
    assert.equal(songResponse.status, 201);
    const song = await songResponse.json();
    created.songId = song.id;

    const username = `utilizador-${suffix}`;
    const password = "palavra-passe-segura";
    const userResponse = await fetch(`${baseUrl}/users`, {
        method: "POST",
        headers: jsonHeaders(adminCookie),
        body: JSON.stringify({
            username,
            password,
            role: "CONTRIBUTOR",
            contributorId: contributor.id,
            allowScoreManagement: false,
            active: true
        })
    });
    assert.equal(userResponse.status, 201);
    const user = await userResponse.json();
    created.userId = user.id;

    let restrictedCookie = await loginCookie(baseUrl, username, password);
    assert.equal((await fetch(`${baseUrl}/songs`, {
        headers: { Cookie: restrictedCookie }
    })).status, 200);
    const ownSongsResponse = await fetch(
        `${baseUrl}/contributors/${contributor.id}/songs`,
        { headers: { Cookie: restrictedCookie } }
    );
    assert.equal(ownSongsResponse.status, 200);
    assert.ok((await ownSongsResponse.json()).some(({ id }) => id === song.id));
    assert.equal((await fetch(`${baseUrl}/contributors`, {
        headers: { Cookie: restrictedCookie }
    })).status, 403);
    assert.equal((await fetch(`${baseUrl}/songs/${song.id}`, {
        method: "DELETE",
        headers: { Cookie: restrictedCookie }
    })).status, 403);
    assert.equal((await fetch(`${baseUrl}/settings`, {
        method: "PUT",
        headers: jsonHeaders(restrictedCookie),
        body: JSON.stringify({})
    })).status, 403);
    assert.equal((await fetch(`${baseUrl}/composers/merge`, {
        method: "POST",
        headers: jsonHeaders(restrictedCookie),
        body: JSON.stringify({ sources: [displayName], name: displayName })
    })).status, 403);

    const forbiddenScore = await scoreForm(
        baseUrl,
        restrictedCookie,
        song,
        await samplePdf(),
        "CHOIR"
    );
    assert.equal(forbiddenScore.status, 403);

    const updateUserResponse = await fetch(`${baseUrl}/users/${user.id}`, {
        method: "PUT",
        headers: jsonHeaders(adminCookie),
        body: JSON.stringify({
            username,
            role: "CONTRIBUTOR",
            contributorId: contributor.id,
            allowScoreManagement: true,
            active: true
        })
    });
    assert.equal(updateUserResponse.status, 200);
    restrictedCookie = await loginCookie(baseUrl, username, password);

    const scoreResponse = await scoreForm(
        baseUrl,
        restrictedCookie,
        song,
        await samplePdf(),
        "CHOIR"
    );
    assert.equal(scoreResponse.status, 201);
    const score = await scoreResponse.json();
    assert.equal(score.category, "CHOIR");
    assert.equal(score.versions.length, 1);

    const massResponse = await fetch(`${baseUrl}/masses`, {
        method: "POST",
        headers: jsonHeaders(adminCookie),
        body: JSON.stringify({
            startsAt: "2026-12-25T10:00:00.000Z",
            church: "Igreja de teste",
            active: true,
            songs: { ENTRANCE: song.id }
        })
    });
    assert.equal(massResponse.status, 201);
    const mass = await massResponse.json();
    created.massId = mass.id;

    const pdfResponse = await fetch(
        `${baseUrl}/masses/${mass.id}/celebration-pdf`,
        { headers: { Cookie: restrictedCookie } }
    );
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get("content-type"), "application/pdf");
    assert.ok((await pdfResponse.arrayBuffer()).byteLength > 100);

    const deleteVersionResponse = await fetch(
        `${baseUrl}/scores/${score.id}/versions/${score.versions[0].id}`,
        { method: "DELETE", headers: { Cookie: restrictedCookie } }
    );
    assert.equal(deleteVersionResponse.status, 204);
    const refreshedSong = await fetch(`${baseUrl}/songs/${song.id}`, {
        headers: { Cookie: restrictedCookie }
    });
    assert.deepEqual((await refreshedSong.json()).scores, []);
    const archivedVersion = await prisma.scoreVersion.findUnique({
        where: { id: score.versions[0].id }
    });
    assert.ok(archivedVersion.deletedAt instanceof Date);
});

test("tag groups can be managed without losing song associations", async (context) => {
    const server = app.listen(0);
    const created = { groupId: null, secondGroupId: null, tagId: null, songId: null };
    context.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        if (created.songId) {
            await prisma.song.deleteMany({ where: { id: created.songId } });
        }
        if (created.tagId) {
            await prisma.tag.deleteMany({ where: { id: created.tagId } });
        }
        await prisma.tagGroup.deleteMany({
            where: {
                id: {
                    in: [created.groupId, created.secondGroupId].filter(Boolean)
                }
            }
        });
    });

    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const cookie = await loginCookie(baseUrl, "test-admin", "test-password");
    const suffix = randomUUID();

    const groupResponse = await fetch(`${baseUrl}/tag-groups`, {
        method: "POST",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({ name: `Grupo temporário ${suffix}`, sortOrder: 900 })
    });
    assert.equal(groupResponse.status, 201);
    const group = await groupResponse.json();
    created.groupId = group.id;

    const secondGroupResponse = await fetch(`${baseUrl}/tag-groups`, {
        method: "POST",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({ name: `Segundo grupo ${suffix}`, sortOrder: 910 })
    });
    assert.equal(secondGroupResponse.status, 201);
    const secondGroup = await secondGroupResponse.json();
    created.secondGroupId = secondGroup.id;

    const tagResponse = await fetch(`${baseUrl}/tags`, {
        method: "POST",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({
            name: `Tag temporária ${suffix}`,
            groupId: group.id,
            sortOrder: 10
        })
    });
    assert.equal(tagResponse.status, 201);
    const tag = await tagResponse.json();
    created.tagId = tag.id;

    const movedTagResponse = await fetch(`${baseUrl}/tags/${tag.id}`, {
        method: "PUT",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({ groupId: secondGroup.id, sortOrder: 20 })
    });
    assert.equal(movedTagResponse.status, 200);
    assert.equal((await movedTagResponse.json()).groupId, secondGroup.id);

    const songResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({
            title: `Cântico com tag arquivada ${suffix}`,
            composerName: `Compositor ${suffix}`,
            songTypes: ["OTHER"],
            tagIds: [tag.id],
            active: true
        })
    });
    assert.equal(songResponse.status, 201);
    const song = await songResponse.json();
    created.songId = song.id;

    const archiveResponse = await fetch(
        `${baseUrl}/tag-groups/${secondGroup.id}`,
        { method: "DELETE", headers: { Cookie: cookie } }
    );
    assert.equal(archiveResponse.status, 204);

    const selectableTags = await fetch(`${baseUrl}/tags`, {
        headers: { Cookie: cookie }
    }).then((response) => response.json());
    assert.ok(!selectableTags.some(({ id }) => id === tag.id));

    const persistedSong = await fetch(`${baseUrl}/songs/${song.id}`, {
        headers: { Cookie: cookie }
    }).then((response) => response.json());
    assert.ok(persistedSong.tags.some(({ id }) => id === tag.id));

    const archivedGroups = await fetch(
        `${baseUrl}/tag-groups?includeArchived=true`,
        { headers: { Cookie: cookie } }
    ).then((response) => response.json());
    const archivedGroup = archivedGroups.find(({ id }) => id === secondGroup.id);
    assert.ok(archivedGroup.deletedAt);
    assert.ok(archivedGroup.tags.some(({ id }) => id === tag.id));
});

test("new celebrations, default church and composer profiles are persisted", async (context) => {
    const server = app.listen(0);
    const created = {
        songId: null,
        contributorId: null,
        massId: null,
        celebrationId: null,
        photoPath: null
    };
    context.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        if (created.massId) {
            await prisma.mass.deleteMany({ where: { id: created.massId } });
        }
        if (created.celebrationId) {
            await prisma.celebration.deleteMany({
                where: { id: created.celebrationId }
            });
        }
        if (created.songId) {
            await prisma.song.deleteMany({ where: { id: created.songId } });
        }
        if (created.contributorId) {
            await prisma.contributor.deleteMany({
                where: { id: created.contributorId }
            });
        }
        if (created.photoPath) {
            await fileRepository.removeFile(created.photoPath);
        }
    });

    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const cookie = await loginCookie(baseUrl, "test-admin", "test-password");
    const suffix = randomUUID();
    const composerName = `Compositor com perfil ${suffix}`;

    const songResponse = await fetch(`${baseUrl}/songs`, {
        method: "POST",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({
            title: `Cântico para perfil ${suffix}`,
            composerName,
            songTypes: ["OTHER"],
            tagIds: [],
            active: true
        })
    });
    assert.equal(songResponse.status, 201);
    created.songId = (await songResponse.json()).id;

    const profileResponse = await fetch(
        `${baseUrl}/composers/${encodeURIComponent(composerName)}/profile`,
        {
            method: "PUT",
            headers: jsonHeaders(cookie),
            body: JSON.stringify({ biography: "Uma pequena biografia." })
        }
    );
    assert.equal(profileResponse.status, 200);
    const profile = await profileResponse.json();
    assert.equal(profile.contributor.biography, "Uma pequena biografia.");
    created.contributorId = profile.contributor.id;

    const photoBody = new FormData();
    photoBody.append(
        "file",
        new Blob([samplePng()], { type: "image/png" }),
        "compositor.png"
    );
    const photoResponse = await fetch(
        `${baseUrl}/composers/${encodeURIComponent(composerName)}/photo`,
        {
            method: "POST",
            headers: { Cookie: cookie },
            body: photoBody
        }
    );
    assert.equal(photoResponse.status, 200);
    assert.ok((await photoResponse.json()).contributor.photoUrl);
    const contributor = await prisma.contributor.findUnique({
        where: { id: created.contributorId }
    });
    created.photoPath = contributor.photoPath;

    const servedPhoto = await fetch(
        `${baseUrl}/composers/${encodeURIComponent(composerName)}/photo`,
        { headers: { Cookie: cookie } }
    );
    assert.equal(servedPhoto.status, 200);
    assert.ok((await servedPhoto.arrayBuffer()).byteLength > 20);

    const celebrationName = `Celebração temporária ${suffix}`;
    const massResponse = await fetch(`${baseUrl}/masses`, {
        method: "POST",
        headers: jsonHeaders(cookie),
        body: JSON.stringify({
            startsAt: "2027-01-01T10:00:00.000Z",
            church: "",
            celebrationName,
            active: true,
            songs: {}
        })
    });
    assert.equal(massResponse.status, 201);
    const mass = await massResponse.json();
    created.massId = mass.id;
    created.celebrationId = mass.celebration.id;
    assert.equal(mass.church, "S. Salvador de Fornelos");
    assert.equal(mass.celebration.name, celebrationName);
});

async function loginCookie(baseUrl, username, password) {
    const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
}

function jsonHeaders(cookie) {
    return {
        "Content-Type": "application/json",
        Cookie: cookie
    };
}

async function samplePdf() {
    const document = await PDFDocument.create();
    document.addPage([200, 200]);
    return document.save();
}

function samplePng() {
    return Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64"
    );
}

async function scoreForm(baseUrl, cookie, song, pdf, category) {
    const body = new FormData();
    body.append("songId", song.id);
    body.append("title", song.title);
    body.append("category", category);
    body.append("active", "true");
    body.append("file", new Blob([pdf], { type: "application/pdf" }), "partitura.pdf");
    return fetch(`${baseUrl}/scores`, {
        method: "POST",
        headers: { Cookie: cookie },
        body
    });
}
