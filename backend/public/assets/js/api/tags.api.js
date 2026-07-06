import { apiRequest } from "./client.js";

export function getTags({ groupId, includeArchived = false } = {}) {
    const query = new URLSearchParams();
    if (groupId) query.set("groupId", groupId);
    if (includeArchived) query.set("includeArchived", "true");
    const suffix = query.toString() ? `?${query}` : "";
    return apiRequest(`/api/tags${suffix}`);
}

export function createTag(data) {
    return apiRequest("/api/tags", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function updateTag(id, data) {
    return apiRequest(`/api/tags/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function archiveTag(id) {
    return apiRequest(`/api/tags/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}
