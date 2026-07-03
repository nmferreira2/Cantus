import { apiRequest } from "./client.js";

export function globalSearch(query) {
    return apiRequest(`/api/search?q=${encodeURIComponent(query)}`);
}
