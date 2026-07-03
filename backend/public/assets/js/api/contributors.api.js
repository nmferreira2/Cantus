import { apiRequest } from "./client.js";

export function getContributors(options = {}) {
    const query = queryString(options);
    return apiRequest(`/api/contributors${query}`);
}

export function getContributor(id) {
    return apiRequest(`/api/contributors/${encodeURIComponent(id)}`);
}

export function createContributor(data) {
    return apiRequest("/api/contributors", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function updateContributor(id, data) {
    return apiRequest(`/api/contributors/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function archiveContributor(id) {
    return apiRequest(`/api/contributors/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}

export function restoreContributor(id) {
    return apiRequest(`/api/contributors/${encodeURIComponent(id)}/restore`, {
        method: "PATCH"
    });
}

function queryString(options) {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });
    return query.size ? `?${query}` : "";
}
