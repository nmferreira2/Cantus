import { apiRequest } from "./client.js";

export function getUsers() {
    return apiRequest("/api/users");
}

export function createUser(data) {
    return apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function updateUser(id, data) {
    return apiRequest(`/api/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function archiveUser(id) {
    return apiRequest(`/api/users/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}
