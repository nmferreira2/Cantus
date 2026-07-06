import { apiRequest } from "./client.js";

export function getTagGroups({ includeArchived = false } = {}) {
    const suffix = includeArchived ? "?includeArchived=true" : "";
    return apiRequest(`/api/tag-groups${suffix}`);
}

export function createTagGroup(data) {
    return apiRequest("/api/tag-groups", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function updateTagGroup(id, data) {
    return apiRequest(`/api/tag-groups/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function archiveTagGroup(id) {
    return apiRequest(`/api/tag-groups/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}
