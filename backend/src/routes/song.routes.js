import { Router } from "express";
import {
    createSong,
    deleteSong,
    permanentlyDeleteSong,
    getAllSongs,
    getSongById,
    restoreSong,
    updateSong
} from "../controllers/song.controller.js";
import {
    downloadSongAttachment,
    importSongFile
} from "../controllers/song-import.controller.js";
import { uploadSongDocument } from "../middleware/upload.middleware.js";
import {
    requirePermission,
    requirePermissionForArchived
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../utils/permissions.js";
import { validateSongQuery } from "../validators/song-query.validator.js";
import { validateSong } from "../validators/song.validator.js";

const router = Router();

router.get(
    "/",
    requirePermissionForArchived(PERMISSIONS.DELETE_SONGS),
    validateSongQuery,
    getAllSongs
);
router.post(
    "/",
    requirePermission(PERMISSIONS.MANAGE_SONGS),
    validateSong,
    createSong
);
router.post(
    "/:id/import",
    requirePermission(PERMISSIONS.MANAGE_SONGS),
    requirePermission(PERMISSIONS.UPLOAD_FILES),
    uploadSongDocument,
    importSongFile
);
router.get("/:id/attachments/:attachmentId/download", downloadSongAttachment);
router.patch(
    "/:id/restore",
    requirePermission(PERMISSIONS.MANAGE_SONGS),
    restoreSong
);
router.get("/:id", getSongById);
router.put(
    "/:id",
    requirePermission(PERMISSIONS.MANAGE_SONGS),
    validateSong,
    updateSong
);
router.delete(
    "/:id/permanent",
    requirePermission(PERMISSIONS.DELETE_SONGS),
    permanentlyDeleteSong
);
router.delete(
    "/:id",
    requirePermission(PERMISSIONS.DELETE_SONGS),
    deleteSong
);

export default router;
