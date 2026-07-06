import assert from "node:assert/strict";
import test from "node:test";

import {
    parseContributor,
    parseContributorQuery
} from "../src/validators/contributor.validator.js";
import { parseComposerMerge } from "../src/validators/composer.validator.js";
import {
    parseCalendarQuery,
    parseMass
} from "../src/validators/mass.validator.js";
import {
    parseScore,
    parseScoreQuery
} from "../src/validators/score.validator.js";
import { parseSettings } from "../src/validators/setting.validator.js";
import { parseUser } from "../src/validators/user.validator.js";

test("contributor validation derives a display name and validates roles", () => {
    const contributor = parseContributor({
        name: "  John ",
        surname: " Bell  ",
        role: "COMPOSER"
    });
    assert.equal(contributor.displayName, "John Bell");
    assert.equal(contributor.active, true);
    assert.throws(
        () => parseContributor({ name: "John", role: "UNKNOWN" }),
        (error) => error.status === 422 && Boolean(error.details.role)
    );
    assert.equal(parseContributorQuery({ page: "2" }).page, 2);
});

test("composer validation normalizes names used in rename and merge", () => {
    assert.deepEqual(parseComposerMerge({
        sources: ["  M. Luís ", "M. Luís", "Manuel Luís"],
        name: " Manuel Luís "
    }), {
        sources: ["M. Luís", "Manuel Luís"],
        name: "Manuel Luís"
    });
    assert.throws(
        () => parseComposerMerge({ sources: [], name: "" }),
        (error) => (
            error.status === 422
            && Boolean(error.details.sources)
            && Boolean(error.details.name)
        )
    );
});

test("score validation handles multipart booleans and query limits", () => {
    const score = parseScore({
        songId: "song-1",
        title: "Assembly score",
        active: "false"
    }, true);
    assert.equal(score.active, false);
    assert.equal(score.description, null);
    assert.equal(score.category, "CHOIR");
    assert.throws(
        () => parseScoreQuery({ format: "TXT" }),
        (error) => error.status === 400
    );
});

test("user validation requires contributor links and safe passwords", () => {
    const user = parseUser({
        username: "cantor",
        password: "segredo-forte",
        role: "CONTRIBUTOR",
        contributorId: "contributor-1",
        allowScoreManagement: true
    });
    assert.equal(user.allowScoreManagement, true);
    assert.throws(
        () => parseUser({
            username: "cantor",
            password: "curta",
            role: "CONTRIBUTOR"
        }),
        (error) => (
            error.status === 422
            && Boolean(error.details.password)
            && Boolean(error.details.contributorId)
        )
    );
});

test("Mass validation normalizes song slots and rejects unknown slots", () => {
    const mass = parseMass({
        startsAt: "2026-12-25T10:00:00.000Z",
        church: "Parish Church",
        songs: {
            ENTRANCE: "song-1",
            ASPERSION: "song-2",
            COMMUNION: "song-3",
            THANKSGIVING: "song-4"
        }
    });
    assert.equal(mass.songs.length, 4);
    assert.ok(mass.startsAt instanceof Date);
    assert.equal(
        parseMass({ startsAt: "2026-12-25T10:00:00.000Z" }).church,
        "S. Salvador de Fornelos"
    );
    assert.throws(
        () => parseMass({
            startsAt: "2026-12-25T10:00:00.000Z",
            church: "Parish Church",
            songs: { PROCESSION: "song-1" }
        }),
        (error) => error.status === 422
    );
});

test("calendar and settings validation enforce safe bounds", () => {
    assert.throws(
        () => parseCalendarQuery({
            from: "2025-01-01",
            to: "2027-01-01"
        }),
        (error) => error.status === 400
    );
    const settings = parseSettings({
        applicationName: "Cantus",
        primaryColor: "#6558D3",
        secondaryColor: "#171822",
        churchName: "",
        churchAddress: "",
        churchEmail: "",
        churchPhone: "",
        defaultLanguage: "English"
    });
    assert.equal(settings.primaryColor, "#6558d3");
});
