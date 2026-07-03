export function applyApplicationSettings(settings) {
    if (!settings) {
        return;
    }

    document.documentElement.style.setProperty(
        "--cantus-primary",
        settings.primaryColor
    );
    document.documentElement.style.setProperty(
        "--cantus-sidebar",
        settings.secondaryColor
    );

    const brandName = document.querySelector(".brand strong");
    if (brandName) {
        brandName.textContent = settings.applicationName;
    }

    const brandMark = document.querySelector(".brand-mark");
    if (brandMark && settings.logoUrl) {
        brandMark.innerHTML = "";
        const image = document.createElement("img");
        image.src = settings.logoUrl;
        image.alt = "";
        brandMark.append(image);
    }

    const titleParts = document.title.split(" · ");
    if (titleParts.length > 1) {
        document.title = `${titleParts[0]} · ${settings.applicationName}`;
    }
}
