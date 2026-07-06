import { apiRequest } from "./client.js";

export function getComposers() {
    return apiRequest("/api/composers");
}

export function getComposer(name) {
    return apiRequest(`/api/composers/${encodeURIComponent(name)}`);
}

export function mergeComposers(sources, name) {
    return apiRequest("/api/composers/merge", {
        method: "POST",
        body: JSON.stringify({ sources, name })
    });
}

export function updateComposerProfile(name, data) {
    return apiRequest(`/api/composers/${encodeURIComponent(name)}/profile`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function uploadComposerPhoto(name, file) {
    const body = new FormData();
    body.append("file", file);
    return apiRequest(`/api/composers/${encodeURIComponent(name)}/photo`, {
        method: "POST",
        body
    });
}
