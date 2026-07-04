export class ApiError extends Error {
    constructor(message, status, details = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export async function apiRequest(url, options = {}) {
    const multipart = options.body instanceof FormData;
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body && !multipart ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        if (
            response.status === 401
            && !url.startsWith("/api/auth/")
        ) {
            window.dispatchEvent(new CustomEvent("cantus:unauthorized"));
        }
        throw new ApiError(
            payload?.error?.message || "Não foi possível concluir o pedido.",
            response.status,
            payload?.error?.details
        );
    }

    return payload;
}
