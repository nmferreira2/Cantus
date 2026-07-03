import { apiRequest } from "./client.js";

export function getTags() {
    return apiRequest("/api/tags");
}

export function createTag(data) {
    return apiRequest("/api/tags", {
        method: "POST",
        body: JSON.stringify(data)
    });
}
