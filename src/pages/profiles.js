import { createProfile, listProfiles, deleteProfile } from "../services/profileService";

function htmlEscape(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCommaList(value) {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function renderProfilesPage(rootEl, user) {
    rootEl.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
    <h1 style="margin:0;">HumanDB</h1>
    <div style="opacity:0.8;">Logged in as ${htmlEscape(user.displayName)}</div>
    </div>

    <hr />

    <h2>Add a profile</h2>
    <form id="createProfileForm" style="display:grid; gap:8px; max-width:520px;">
    <input name="name" placeholder="Name (required)" required />
    <input name="birthday" type="date" />
    <input name="personality" placeholder="Personality (e.g., nonchalant)" />
    <input name="favorites" placeholder="Favorites (comma separated)" />
    <input name="games" placeholder="Games (comma separated)" />
    <input name="dislikes" placeholder="Dislikes (comma separated)" />
    <button type="submit">Create</button>
    <div id="formMsg" style="min-height:20px;"></div>
    </form>

    <hr />

    <h2>Your profiles</h2>
    <div id="profilesList" style="display:grid; gap:10px;"></div>
`;

const listEl = rootEl.querySelector("#profilesList");
const form = rootEl.querySelector("#createProfileForm");
const msgEl = rootEl.querySelector("#formMsg");

async function refresh() {
    const profiles = await listProfiles(user.uid);

    if (!profiles.length) {
    listEl.innerHTML = `<p style="opacity:0.7;">No profiles yet. Add one above.</p>`;
    return;
    }

    listEl.innerHTML = profiles
    .map((p) => {
        const favorites = Array.isArray(p.favorites) ? p.favorites.join(", ") : "";
        const games = Array.isArray(p.games) ? p.games.join(", ") : "";
        const dislikes = Array.isArray(p.dislikes) ? p.dislikes.join(", ") : "";

        return `
            <div data-id="${p.id}" style="border:1px solid #333; border-radius:10px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div>
                <strong>${htmlEscape(p.name)}</strong>
                ${p.personality ? `<span style="opacity:0.7;"> — ${htmlEscape(p.personality)}</span>` : ""}
                </div>
                <button class="deleteBtn">Delete</button>
            </div>

            <div style="margin-top:8px; display:grid; gap:4px; opacity:0.9;">
            ${p.birthday ? `<div><b>Birthday:</b> ${htmlEscape(String(p.birthday))}</div>` : ""}
            ${favorites ? `<div><b>Favorites:</b> ${htmlEscape(favorites)}</div>` : ""}
            ${games ? `<div><b>Games:</b> ${htmlEscape(games)}</div>` : ""}
            ${dislikes ? `<div><b>Dislikes:</b> ${htmlEscape(dislikes)}</div>` : ""}
            </div>
        </div>
        `;
}).join("");

    listEl.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
        const card = e.target.closest("[data-id]");
        const id = card?.getAttribute("data-id");
        if (!id) return;

        const ok = confirm("Delete this profile?");
        if (!ok) return;

        await deleteProfile(id);
        await refresh();
    });
    });
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "";

    const fd = new FormData(form);
    const name = fd.get("name");
    const birthday = fd.get("birthday") || null; // keep as YYYY-MM-DD string for now
    const personality = fd.get("personality");

    const favorites = parseCommaList(fd.get("favorites") || "");
    const games = parseCommaList(fd.get("games") || "");
    const dislikes = parseCommaList(fd.get("dislikes") || "");

    try {
    await createProfile(user.uid, {
        name,
        birthday,
        personality,
        favorites,
        games,
        dislikes,
    });

    form.reset();
    msgEl.textContent = "Created ✅";
    await refresh();
    } catch (err) {
    msgEl.textContent = err?.message ?? "Failed to create profile";
    }
});

await refresh();
}
