import * as service from "../services/score.service.js";

export async function getScores(req, res) {
    return res.json(await service.getScores(req.validatedQuery));
}

export async function getScore(req, res) {
    return res.json(await service.getScore(req.params.id));
}

export async function createScore(req, res) {
    return res.status(201).json(
        await service.createScore(req.validatedBody, req.file, req.user)
    );
}

export async function updateScore(req, res) {
    return res.json(
        await service.updateScore(req.params.id, req.validatedBody, req.user)
    );
}

export async function addScoreVersion(req, res) {
    return res.status(201).json(
        await service.addScoreVersion(req.params.id, req.file, req.user)
    );
}

export async function serveScoreVersion(req, res, next) {
    const version = await service.getScoreVersionFile(
        req.params.id,
        req.params.versionId
    );

    if (req.query.download === "true") {
        return res.download(version.absolutePath, version.originalName, (error) => {
            if (error) next(error);
        });
    }

    res.type(version.mimeType);
    res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(version.originalName)}`
    );
    return res.sendFile(version.absolutePath, (error) => {
        if (error) next(error);
    });
}

export async function archiveScore(req, res) {
    await service.archiveScore(req.params.id, req.user);
    return res.status(204).send();
}

export async function restoreScore(req, res) {
    return res.json(await service.restoreScore(req.params.id, req.user));
}

export async function archiveScoreVersion(req, res) {
    await service.archiveScoreVersion(
        req.params.id,
        req.params.versionId,
        req.user
    );
    return res.status(204).send();
}
