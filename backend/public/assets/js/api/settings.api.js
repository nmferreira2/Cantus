import { apiRequest } from "./client.js";

export function getSettings() {
    return apiRequest("/api/settings");
}

export function updateSettings(data) {
    return apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function uploadLogo(file) {
    const body = new FormData();
    body.append("file", file);
    return apiRequest("/api/settings/logo", {
        method: "POST",
        body
    });
}
