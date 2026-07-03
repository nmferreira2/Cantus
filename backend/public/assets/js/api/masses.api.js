import { apiRequest } from "./client.js";

export function getMasses(options = {}) {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    return apiRequest(`/api/masses${query.size ? `?${query}` : ""}`);
}

export function getMass(id) {
    return apiRequest(`/api/masses/${encodeURIComponent(id)}`);
}

export function getMassReferences() {
    return apiRequest("/api/masses/references");
}

export function getMassCalendar(from, to) {
    const query = new URLSearchParams({ from, to });
    return apiRequest(`/api/masses/calendar?${query}`);
}

export function createMass(data) {
    return apiRequest("/api/masses", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function updateMass(id, data) {
    return apiRequest(`/api/masses/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function archiveMass(id) {
    return apiRequest(`/api/masses/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}

export function restoreMass(id) {
    return apiRequest(`/api/masses/${encodeURIComponent(id)}/restore`, {
        method: "PATCH"
    });
}
