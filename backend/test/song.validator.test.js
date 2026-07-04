import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../src/utils/app-error.js";
import { parseSong } from "../src/validators/song.validator.js";

test("parseSong trims input and supplies safe defaults", () => {
    assert.deepEqual(parseSong({
        title: "  Kyrie  ",
        composerName: "  José Silva "
    }), {
        title: "Kyrie",
        subtitle: null,
        composerName: "José Silva",
        arrangerName: null,
        harmonizerName: null,
        originalKey: null,
        language: null,
        lyrics: null,
        notes: null,
        songTypes: ["OTHER"],
        active: true,
        tagIds: []
    });
});

test("parseSong normalizes and deduplicates tags and song types", () => {
    const song = parseSong({
        title: "Gloria",
        composerName: "Maria",
        tagIds: [" tag-a ", "tag-a", "tag-b"],
        songTypes: ["ENTRANCE", "FINAL", "ENTRANCE"]
    });

    assert.deepEqual(song.tagIds, ["tag-a", "tag-b"]);
    assert.deepEqual(song.songTypes, ["ENTRANCE", "FINAL"]);
});

test("parseSong rejects a missing title", () => {
    assert.throws(
        () => parseSong({ title: " ", composerName: "Maria" }),
        (error) => {
            assert.ok(error instanceof AppError);
            assert.equal(error.status, 422);
            assert.equal(error.details.title, "O título é obrigatório.");
            return true;
        }
    );
});

test("parseSong requires a composer with a clear Portuguese message", () => {
    assert.throws(
        () => parseSong({ title: "Glória", composerName: "" }),
        (error) => {
            assert.equal(error.status, 422);
            assert.equal(error.details.composerName, "O compositor é obrigatório.");
            return true;
        }
    );
});

test("parseSong rejects invalid and unsupported fields", () => {
    assert.throws(
        () => parseSong({
            title: "Gloria",
            composerName: "Maria",
            songTypes: ["HYMN"]
        }),
        (error) => error.status === 422 && Boolean(error.details.songTypes)
    );

    assert.throws(
        () => parseSong({ title: "Gloria", composerName: "Maria", id: "owned-by-server" }),
        (error) => error.status === 400
    );
});
