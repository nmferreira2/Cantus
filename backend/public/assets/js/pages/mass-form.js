import {
    createMass,
    getMass,
    getMassReferences,
    updateMass
} from "../api/masses.api.js";
import { getAllSongs } from "../api/songs.api.js";
import { inputField, textareaField } from "../components/form.js";
import { setFlash } from "../components/toast.js";
import { router } from "../router.js";
import { escapeHtml } from "../utils/format.js";
import { MASS_SLOTS } from "../utils/masses.js";

const ORDINARY_SLOT_TAGS = Object.freeze({
    PENITENTIAL: ["Ato Penitencial", "Acto Penitencial", "Kyrie"],
    ASPERSION: ["Aspersão", "Rito da Aspersão"],
    GLORIA: ["Glória"],
    ALLELUIA: ["Aclamação ao Evangelho", "Aleluia"],
    HOLY: ["Santo"],
    LAMB_OF_GOD: ["Cordeiro de Deus"]
});

let availableSongs = [];

export function massFormPage(id = null) {
    const editing = Boolean(id);
    return {
        title: editing ? "Editar missa" : "Planear missa",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Planeamento da missa</p><h2>${editing ? "Editar missa" : "Planear missa"}</h2><p class="page-description">Defina a celebração e escolha os cânticos do repertório.</p></div><a href="${editing ? `/masses/${encodeURIComponent(id)}` : "/masses"}" class="btn btn-light" data-link><i class="bi bi-arrow-left"></i> Cancelar</a></section>
            <form id="mass-form" class="card-surface form-card" novalidate><div id="form-alert"></div><fieldset disabled>
                <div class="form-section"><div><h3>Celebração</h3><p>Data, local e contexto litúrgico.</p></div><div class="form-grid">
                    ${startsAtField()}
                    ${inputField({ name: "church", label: "Igreja", placeholder: "S. Salvador de Fornelos" })}
                    ${inputField({ name: "celebrationName", label: "Celebração", placeholder: "Ex.: Domingo VII do Tempo Comum" })}
                    <div class="form-field"><label class="form-label" for="seasonId">Tempo litúrgico</label><select id="seasonId" name="seasonId" class="form-select"></select></div>
                    ${inputField({ name: "presider", label: "Presidente" })}
                    ${inputField({ name: "choir", label: "Coro" })}
                    ${textareaField({ name: "comments", label: "Observações", rows: 4 })}
                    <div class="form-check form-switch align-self-end mb-3"><input id="active" name="active" class="form-check-input" type="checkbox" checked><label for="active" class="form-check-label">Planeamento ativo</label></div>
                </div></div>
                <div class="form-section"><div><h3>Plano musical</h3><p>Escolha um cântico para cada momento litúrgico.</p></div><div class="mass-slot-grid" id="mass-slots"></div></div>
                <div class="form-section"><div><h3>Cânticos extra</h3><p>Adicione cânticos para momentos especiais da celebração, como Osculação, procissões ou outros contextos.</p></div><div class="extra-song-panel"><div id="extra-songs"></div><button class="btn btn-light" type="button" data-add-extra-song><i class="bi bi-plus-lg"></i> Adicionar cântico extra</button></div></div>
                <div class="form-actions"><a href="/masses" class="btn btn-light" data-link>Cancelar</a><button class="btn btn-primary" type="submit"><span class="button-label">${editing ? "Guardar alterações" : "Criar planeamento"}</span><span class="spinner-border spinner-border-sm d-none"></span></button></div>
            </fieldset></form>
        `,
        mount: () => mount(id)
    };
}

async function mount(id) {
    const form = document.querySelector("#mass-form");
    try {
        const [references, songs, mass] = await Promise.all([
            getMassReferences(),
            getAllSongs({ status: "active", sortBy: "title" }),
            id ? getMass(id) : Promise.resolve(null)
        ]);
        fillOptions(form, references, songs);
        bindExtraSongs(form);
        if (mass) {
            fillMass(form, mass);
        } else {
            form.elements.church.value = "S. Salvador de Fornelos";
        }
        form.querySelector("fieldset").disabled = false;
    } catch (error) { showError(error.message); return; }
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        form.elements.startsAt.setCustomValidity("");
        const startsAt = parseStartsAt(form.elements.startsAt.value);
        if (!startsAt) {
            form.elements.startsAt.setCustomValidity(
                "Indique uma data e hora válidas no formato dd/mm/aaaa HH:mm."
            );
        }
        form.classList.add("was-validated");
        if (!form.checkValidity()) return;
        const button = form.querySelector('button[type="submit"]'); toggle(button, true);
        try {
            const songs = Object.fromEntries(MASS_SLOTS.map(([slot]) => [slot, form.elements[`slot-${slot}`].value]).filter(([, songId]) => songId));
            const extraSongs = collectExtraSongs(form);
            const data = {
                startsAt: startsAt.toISOString(),
                church: form.elements.church.value,
                celebrationName: form.elements.celebrationName.value,
                seasonId: form.elements.seasonId.value,
                presider: form.elements.presider.value,
                choir: form.elements.choir.value,
                comments: form.elements.comments.value,
                active: form.elements.active.checked,
                songs,
                extraSongs
            };
            const mass = id ? await updateMass(id, data) : await createMass(data);
            setFlash(`Missa ${id ? "atualizada" : "planeada"} com sucesso.`);
            router.navigate(`/masses/${encodeURIComponent(mass.id)}`);
        } catch (error) { showError(error.message); toggle(button, false); }
    });
}

function fillOptions(form, references, songs) {
    availableSongs = songs;
    form.elements.seasonId.innerHTML = `<option value="">Escolha o tempo</option>${references.seasons.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}`;
    document.querySelector("#mass-slots").innerHTML = MASS_SLOTS.map(([slot, label]) => {
        const slotSongs = songsForSlot(songs, slot);
        return `<div class="form-field"><label class="form-label" for="slot-${slot}">${label}</label><select id="slot-${slot}" name="slot-${slot}" class="form-select">${songOptions(slotSongs)}</select></div>`;
    }).join("");
}

function bindExtraSongs(form) {
    form.querySelector("[data-add-extra-song]").addEventListener("click", () => {
        addExtraSongRow();
    });
    form.querySelector("#extra-songs").addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-extra-song]");
        if (removeButton) {
            removeButton.closest("[data-extra-song-row]")?.remove();
        }
    });
}

function addExtraSongRow(extra = {}) {
    const container = document.querySelector("#extra-songs");
    const index = container.querySelectorAll("[data-extra-song-row]").length + 1;
    container.insertAdjacentHTML("beforeend", `
        <div class="extra-song-row" data-extra-song-row>
            <div class="form-field">
                <label class="form-label">Momento/contexto</label>
                <input class="form-control" data-extra-label maxlength="100" placeholder="Ex.: Osculação" value="${escapeHtml(extra.label ?? "")}">
            </div>
            <div class="form-field">
                <label class="form-label">Cântico extra ${index}</label>
                <select class="form-select" data-extra-song>${songOptions(availableSongs)}</select>
            </div>
            <button class="icon-button icon-button-danger extra-song-remove" type="button" data-remove-extra-song title="Remover cântico extra"><i class="bi bi-trash3"></i></button>
        </div>
    `);
    const row = container.lastElementChild;
    row.querySelector("[data-extra-song]").value = extra.songId ?? "";
}

function collectExtraSongs(form) {
    return [...form.querySelectorAll("[data-extra-song-row]")]
        .map((row) => ({
            label: row.querySelector("[data-extra-label]").value.trim(),
            songId: row.querySelector("[data-extra-song]").value
        }))
        .filter(({ songId }) => songId);
}

function songOptions(songs) {
    return `<option value="">Sem cântico selecionado</option>${songs.map((song) => {
        const credits = [
            song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
            song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
        ].filter(Boolean).join(" · ");
        return `<option value="${escapeHtml(song.id)}">${escapeHtml(
            `${song.title} — ${song.composerName}${credits ? ` [${credits}]` : ""}`
        )}</option>`;
    }).join("")}`;
}

function songsForSlot(songs, slot) {
    const tagNames = ORDINARY_SLOT_TAGS[slot];
    if (!tagNames) {
        return songs;
    }

    const normalizedTags = tagNames.map(normalize);
    return songs.filter((song) => (
        song.tags?.some((tag) => normalizedTags.includes(normalize(tag.name)))
    ));
}

function normalize(value) {
    return String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("pt-PT");
}

function fillMass(form, mass) {
    form.elements.startsAt.value = formatStartsAt(mass.startsAt);
    ["church", "seasonId", "presider", "choir", "comments"].forEach((field) => { form.elements[field].value = mass[field] ?? ""; });
    form.elements.celebrationName.value = mass.celebration?.name ?? "";
    form.elements.active.checked = mass.active;
    mass.songs
        .filter(({ slot }) => slot !== "EXTRA")
        .forEach(({ slot, songId }) => {
            form.elements[`slot-${slot}`].value = songId;
        });
    mass.songs
        .filter(({ slot }) => slot === "EXTRA")
        .sort((first, second) => first.position - second.position)
        .forEach((extra) => addExtraSongRow(extra));
}

function startsAtField() {
    return `
        <div class="form-field">
            <label class="form-label" for="startsAt">Data e hora <span aria-hidden="true">*</span></label>
            <input
                class="form-control"
                id="startsAt"
                name="startsAt"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="dd/mm/aaaa HH:mm"
                pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]"
                required
            >
            <div class="invalid-feedback">Indique uma data e hora válidas no formato dd/mm/aaaa HH:mm.</div>
        </div>
    `;
}

function parseStartsAt(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4}) ([01]\d|2[0-3]):([0-5]\d)$/
        .exec(value.trim());
    if (!match) {
        return null;
    }

    const [, day, month, year, hour, minute] = match.map(Number);
    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (
        date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
        || date.getHours() !== hour
        || date.getMinutes() !== minute
    ) {
        return null;
    }
    return date;
}

function formatStartsAt(value) {
    const date = new Date(value);
    const pad = (part) => String(part).padStart(2, "0");
    return [
        pad(date.getDate()),
        pad(date.getMonth() + 1),
        date.getFullYear()
    ].join("/") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function showError(message) { const target = document.querySelector("#form-alert"); target.innerHTML = '<div class="alert alert-danger"></div>'; target.firstElementChild.textContent = message; }
function toggle(button, loading) { button.disabled = loading; button.querySelector(".button-label").classList.toggle("d-none", loading); button.querySelector(".spinner-border").classList.toggle("d-none", !loading); }
