import { apiRequest } from "./client.js";

export function getScores(options = {}) {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    return apiRequest(`/api/scores${query.size ? `?${query}` : ""}`);
}

export function getScore(id) {
    return apiRequest(`/api/scores/${encodeURIComponent(id)}`);
}

export function createScore(data, file) {
    const body = scoreFormData(data, file);
    return apiRequest("/api/scores", { method: "POST", body });
}

export function updateScore(id, data) {
    return apiRequest(`/api/scores/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function addScoreVersion(id, file) {
    const body = new FormData();
    body.append("file", file);
    return apiRequest(`/api/scores/${encodeURIComponent(id)}/versions`, {
        method: "POST",
        body
    });
}

export function archiveScore(id) {
    return apiRequest(`/api/scores/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}

export function restoreScore(id) {
    return apiRequest(`/api/scores/${encodeURIComponent(id)}/restore`, {
        method: "PATCH"
    });
}

export function scoreFileUrl(scoreId, versionId, download = false) {
    const suffix = download ? "?download=true" : "";
    return `/api/scores/${encodeURIComponent(scoreId)}/versions/${encodeURIComponent(
        versionId
    )}/file${suffix}`;
}

function scoreFormData(data, file) {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) body.append(key, value);
    });
    body.append("file", file);
    return body;
}
