import * as service from "../services/statistics.service.js";

export async function getStatistics(req, res) {
    return res.json(await service.getStatistics());
}
