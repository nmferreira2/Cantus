import { ApiError, apiRequest } from "./client.js";

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

export async function getAllSongs(options = {}) {
    const songs = [];
    let page = 1;
    let totalPages = 1;

    do {
        const response = await getSongs({
            ...options,
            page,
            pageSize: 100
        });
        songs.push(...response.data);
        totalPages = response.pagination.totalPages;
        page += 1;
    } while (page <= totalPages);

    return songs;
}

export function getSong(id) {
    return apiRequest(`/api/songs/${encodeURIComponent(id)}`);
}

export async function getSongListPdf(options = {}) {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });

    const response = await fetch(`/api/songs/export/pdf${query.size ? `?${query}` : ""}`);
    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent("cantus:unauthorized"));
        }
        throw new ApiError(
            payload?.error?.message || "Não foi possível exportar a listagem de cânticos.",
            response.status,
            payload?.error?.details
        );
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    return {
        blob: await response.blob(),
        filename: encodedName
            ? decodeURIComponent(encodedName)
            : "canticos.pdf"
    };
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

export function permanentlyDeleteSong(id) {
    return apiRequest(`/api/songs/${encodeURIComponent(id)}/permanent`, {
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
