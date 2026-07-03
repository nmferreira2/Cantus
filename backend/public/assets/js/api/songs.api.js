import { apiRequest } from "./client.js";

export function getSongs(options = {}) {
    const query = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });

    const suffix = query.size > 0 ? `?${query}` : "";
    return apiRequest(`/api/songs${suffix}`);
}

export function getSongFacets() {
    return apiRequest("/api/songs/meta/facets");
}

export function getSong(id) {
    return apiRequest(`/api/songs/${encodeURIComponent(id)}`);
}

export function createSong(song) {
    return apiRequest("/api/songs", {
        method: "POST",
        body: JSON.stringify(song)
    });
}

export function updateSong(id, song) {
    return apiRequest(`/api/songs/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(song)
    });
}

export function deleteSong(id) {
    return apiRequest(`/api/songs/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}

export function restoreSong(id) {
    return apiRequest(`/api/songs/${encodeURIComponent(id)}/restore`, {
        method: "PATCH"
    });
}

export function importSongFile(id, file) {
    const body = new FormData();
    body.append("file", file);

    return apiRequest(`/api/songs/${encodeURIComponent(id)}/import`, {
        method: "POST",
        body
    });
}

export function songAttachmentUrl(songId, attachmentId) {
    return `/api/songs/${encodeURIComponent(songId)}/attachments/${encodeURIComponent(
        attachmentId
    )}/download`;
}
