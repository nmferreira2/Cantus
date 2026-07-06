import {
    createHash,
    createHmac,
    timingSafeEqual
} from "node:crypto";

export const SESSION_COOKIE = "cantus_session";
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

export function authenticateCredentials(username, password) {
    const config = getAuthConfig();
    return safeEqual(username, config.username)
        && safeEqual(password, config.password);
}

export function createSessionToken(user) {
    const config = getAuthConfig();
    const payload = Buffer.from(JSON.stringify({
        sub: user.username,
        uid: user.id ?? null,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
    })).toString("base64url");

    return `${payload}.${sign(payload, config.secret)}`;
}

export function readSession(req) {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];

    if (!token) {
        return null;
    }

    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) {
        return null;
    }

    const config = getAuthConfig();
    if (!safeEqual(signature, sign(payload, config.secret))) {
        return null;
    }

    try {
        const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (
            typeof session.sub !== "string"
            || !["ADMIN", "CONTRIBUTOR"].includes(session.role)
            || !Number.isInteger(session.exp)
            || session.exp <= Math.floor(Date.now() / 1000)
        ) {
            return null;
        }
        return session;
    } catch {
        return null;
    }
}

export function environmentAdminUsername() {
    return getAuthConfig().username;
}

export function sessionCookie(token) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return [
        `${SESSION_COOKIE}=${token}`,
        "HttpOnly",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${SESSION_DURATION_SECONDS}`
    ].join("; ") + secure;
}

export function clearedSessionCookie() {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function getAuthConfig() {
    const username = process.env.AUTH_USERNAME?.trim();
    const password = process.env.AUTH_PASSWORD;
    const secret = process.env.SESSION_SECRET;

    if (!username || !password || !secret || secret.length < 32) {
        throw new Error(
            "AUTH_USERNAME, AUTH_PASSWORD e SESSION_SECRET (mínimo de 32 caracteres) são obrigatórios."
        );
    }

    return { username, password, secret };
}

function sign(payload, secret) {
    return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left, right) {
    const leftHash = createHash("sha256").update(String(left)).digest();
    const rightHash = createHash("sha256").update(String(right)).digest();
    return timingSafeEqual(leftHash, rightHash);
}

function parseCookies(header = "") {
    return Object.fromEntries(
        header.split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const separator = part.indexOf("=");
                if (separator < 0) {
                    return [part, ""];
                }
                return [
                    part.slice(0, separator),
                    part.slice(separator + 1)
                ];
            })
    );
}
