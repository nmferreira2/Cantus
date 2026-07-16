import assert from "node:assert/strict";
import test from "node:test";

import { parseSongQuery } from "../src/validators/song-query.validator.js";

test("parseSongQuery supplies stable pagination and sorting defaults", () => {
    assert.deepEqual(parseSongQuery(), {
        search: "",
        page: 1,
        pageSize: 10000,
        sortBy: "title",
        sortOrder: "asc",
        status: "current",
        songType: "",
        language: "",
        tagId: ""
    });
});

test("parseSongQuery parses supported filters", () => {
    const query = parseSongQuery({
        page: "2",
        pageSize: "25",
        sortBy: "composerName",
        sortOrder: "desc",
        status: "archived",
        songType: "COMMUNION",
        language: " English ",
        tagId: "tag-season-easter"
    });

    assert.equal(query.page, 2);
    assert.equal(query.pageSize, 25);
    assert.equal(query.sortBy, "composerName");
    assert.equal(query.language, "English");
    assert.equal(query.status, "archived");
});

test("parseSongQuery rejects invalid paging and sort input", () => {
    assert.throws(
        () => parseSongQuery({ page: "0", sortBy: "deletedAt" }),
        (error) => error.status === 400
            && Boolean(error.details.page)
            && Boolean(error.details.sortBy)
    );
});
