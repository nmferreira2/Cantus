import { Router } from "express";
import {
    createSong,
    deleteSong,
    getAllSongs,
    getSongFacets,
    getSongById,
    restoreSong,
    updateSong
} from "../controllers/song.controller.js";
import {
    downloadSongAttachment,
    importSongFile
} from "../controllers/song-import.controller.js";
import { uploadSongDocument } from "../middleware/upload.middleware.js";
import { validateSongQuery } from "../validators/song-query.validator.js";
import { validateSong } from "../validators/song.validator.js";

const router = Router();

router.get("/", validateSongQuery, getAllSongs);
router.post("/", validateSong, createSong);
router.get("/meta/facets", getSongFacets);
router.post("/:id/import", uploadSongDocument, importSongFile);
router.get("/:id/attachments/:attachmentId/download", downloadSongAttachment);
router.patch("/:id/restore", restoreSong);
router.get("/:id", getSongById);
router.put("/:id", validateSong, updateSong);
router.delete("/:id", deleteSong);

export default router;
