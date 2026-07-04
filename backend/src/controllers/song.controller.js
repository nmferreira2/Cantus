import * as service from "../services/song.service.js";

export async function getAllSongs(req, res) {
    const songs = await service.getAllSongs(req.validatedQuery);
    return res.json(songs);
}

export async function createSong(req, res) {
    const song = await service.createSong(req.validatedBody);
    return res.status(201).json(song);
}

export async function getSongById(req, res) {
    const song = await service.getSongById(req.params.id);
    return res.json(song);
}

export async function updateSong(req, res) {
    const song = await service.updateSong(req.params.id, req.validatedBody);
    return res.json(song);
}

export async function deleteSong(req, res) {
    await service.deleteSong(req.params.id);
    return res.status(204).send();
}

export async function permanentlyDeleteSong(req, res) {
    await service.permanentlyDeleteSong(req.params.id);
    return res.status(204).send();
}

export async function restoreSong(req, res) {
    const song = await service.restoreSong(req.params.id);
    return res.json(song);
}
