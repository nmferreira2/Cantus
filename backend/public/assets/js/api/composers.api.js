import { apiRequest } from "./client.js";

export function getComposers() {
    return apiRequest("/api/composers");
}

export function mergeComposers(sources, name) {
    return apiRequest("/api/composers/merge", {
        method: "POST",
        body: JSON.stringify({ sources, name })
    });
}
