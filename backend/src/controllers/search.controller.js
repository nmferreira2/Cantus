import * as service from "../services/search.service.js";

export async function search(req, res) {
    return res.json(await service.search(req.query.q));
}
