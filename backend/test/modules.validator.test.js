import assert from "node:assert/strict";
import test from "node:test";

import {
    parseContributor,
    parseContributorQuery
} from "../src/validators/contributor.validator.js";
import {
    parseCalendarQuery,
    parseMass
} from "../src/validators/mass.validator.js";
import {
    parseScore,
    parseScoreQuery
} from "../src/validators/score.validator.js";
import { parseSettings } from "../src/validators/setting.validator.js";

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

test("score validation handles multipart booleans and query limits", () => {
    const score = parseScore({
        songId: "song-1",
        title: "Assembly score",
        active: "false"
    }, true);
    assert.equal(score.active, false);
    assert.equal(score.description, null);
    assert.throws(
        () => parseScoreQuery({ format: "TXT" }),
        (error) => error.status === 400
    );
});

test("Mass validation normalizes song slots and rejects unknown slots", () => {
    const mass = parseMass({
        startsAt: "2026-12-25T10:00:00.000Z",
        church: "Parish Church",
        songs: {
            ENTRANCE: "song-1",
            COMMUNION: "song-2"
        }
    });
    assert.equal(mass.songs.length, 2);
    assert.ok(mass.startsAt instanceof Date);
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
