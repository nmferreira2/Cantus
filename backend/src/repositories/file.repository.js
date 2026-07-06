import {
    access,
    mkdir,
    readFile,
    unlink,
    writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const storageRoot = path.resolve(currentDirectory, "../../storage");

export async function saveFile(relativePath, buffer) {
    const absolutePath = resolveStoragePath(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer, { flag: "wx" });
    return absolutePath;
}

export async function removeFile(relativePath) {
    const absolutePath = resolveStoragePath(relativePath);
    await unlink(absolutePath).catch((error) => {
        if (error.code !== "ENOENT") {
            throw error;
        }
    });
}

export async function getExistingFilePath(relativePath) {
    const absolutePath = resolveStoragePath(relativePath);
    await access(absolutePath);
    return absolutePath;
}

export async function readStoredFile(relativePath) {
    return readFile(resolveStoragePath(relativePath));
}

function resolveStoragePath(relativePath) {
    const absolutePath = path.resolve(storageRoot, relativePath);

    if (
        absolutePath !== storageRoot
        && !absolutePath.startsWith(`${storageRoot}${path.sep}`)
    ) {
        throw new Error("Storage path escapes the configured root");
    }

    return absolutePath;
}
