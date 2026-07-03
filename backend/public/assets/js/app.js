import { getSettings } from "./api/settings.api.js";
import { router } from "./router.js";
import { applyApplicationSettings } from "./utils/settings.js";

router.start();

getSettings()
    .then((settings) => {
        window.cantusSettings = settings;
        applyApplicationSettings(settings);
    })
    .catch(() => {
        // The application remains usable with the built-in visual defaults.
    });
