export function bindFileDrop({ dropZone, input, onDrop }) {
    if (!dropZone || !input) {
        return;
    }

    const preventDefault = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    const setActive = (active) => {
        dropZone.classList.toggle("drag-active", active);
    };

    ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            preventDefault(event);
            setActive(true);
        });
    });
    ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
            preventDefault(event);
            setActive(false);
        });
    });
    dropZone.addEventListener("drop", (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file) {
            return;
        }

        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        onDrop?.(file);
    });
}
