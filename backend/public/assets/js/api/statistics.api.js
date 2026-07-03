import { apiRequest } from "./client.js";

export function getStatistics() {
    return apiRequest("/api/statistics");
}
