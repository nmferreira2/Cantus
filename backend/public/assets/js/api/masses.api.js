import { ApiError, apiRequest } from "./client.js";

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

export async function getCelebrationPdf(id) {
    const url = `/api/masses/${encodeURIComponent(id)}/celebration-pdf`;
    const response = await fetch(url);
    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent("cantus:unauthorized"));
        }
        throw new ApiError(
            payload?.error?.message || "Não foi possível gerar o PDF da celebração.",
            response.status,
            payload?.error?.details
        );
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    return {
        blob: await response.blob(),
        filename: encodedName
            ? decodeURIComponent(encodedName)
            : "celebracao.pdf"
    };
}

export async function getCelebrationText(id) {
    const url = `/api/masses/${encodeURIComponent(id)}/celebration-text`;
    const response = await fetch(url);
    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent("cantus:unauthorized"));
        }
        throw new ApiError(
            payload?.error?.message || "Não foi possível exportar o planeamento.",
            response.status,
            payload?.error?.details
        );
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    return {
        blob: await response.blob(),
        filename: encodedName
            ? decodeURIComponent(encodedName)
            : "planeamento.txt"
    };
}
