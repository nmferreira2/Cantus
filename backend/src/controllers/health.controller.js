export const getHealth = (req, res) => {
    res.json({
        application: "Cantus",
        version: "1.0.0",
        status: "ok"
    });
};
