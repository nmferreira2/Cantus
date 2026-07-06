import * as service from "../services/mass.service.js";

export async function getMasses(req, res) {
    return res.json(await service.getMasses(req.validatedQuery));
}

export async function getCalendar(req, res) {
    return res.json(await service.getCalendar(req.validatedQuery));
}

export async function getReferences(req, res) {
    return res.json(await service.getReferences());
}

export async function getMass(req, res) {
    return res.json(await service.getMass(req.params.id));
}

export async function createMass(req, res) {
    return res.status(201).json(await service.createMass(req.validatedBody));
}

export async function updateMass(req, res) {
    return res.json(await service.updateMass(req.params.id, req.validatedBody));
}

export async function archiveMass(req, res) {
    await service.archiveMass(req.params.id);
    return res.status(204).send();
}

export async function restoreMass(req, res) {
    return res.json(await service.restoreMass(req.params.id));
}

export async function generateCelebrationPdf(req, res) {
    const pdf = await service.generateCelebrationPdf(req.params.id);
    res.type("application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(pdf.filename)}`
    );
    return res.send(pdf.buffer);
}
