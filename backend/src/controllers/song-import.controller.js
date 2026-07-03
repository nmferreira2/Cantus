import * as service from "../services/song-import.service.js";

export async function importSongFile(req, res) {
    const attachment = await service.importSongFile(req.params.id, req.file);
    return res.status(201).json(attachment);
}

export async function downloadSongAttachment(req, res, next) {
    const attachment = await service.getSongAttachment(
        req.params.id,
        req.params.attachmentId
    );

    return res.download(
        attachment.absolutePath,
        attachment.originalName,
        (error) => error && next(error)
    );
}
