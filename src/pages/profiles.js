import { createProfile, listProfiles, deleteProfile, updateProfile, getProfileById, uploadProfilePicture } from "../services/profileService";

function htmlEscape(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function renderFieldsetHTML(isEdit = false) {
  return `
    <fieldset style="display:grid; gap:8px; border:1px solid #444; padding:12px; margin-bottom:12px; border-radius:6px;">
      <legend style="font-weight:bold;">Basic Info</legend>
      ${isEdit ? '<input type="hidden" name="id" />' : ''}
      <input name="name" placeholder="Name (required)" required />
      <label style="font-size:0.9em; opacity:0.8;">Profile Picture ${isEdit ? '(leave empty to keep current)' : ''}:</label>
      <input type="file" name="pfp" accept="image/*" />
      <div style="display:flex; gap:8px;">
        <label style="flex:1; display:flex; flex-direction:column; font-size:0.9em;">
          Birthday
          <input name="birthday" type="date" />
        </label>
      </div>
      <input name="tags" placeholder="Tags (comma separated, e.g., friend, gamer)" />
      <input name="dislikes" placeholder="Dislikes (comma separated)" />
      <textarea name="notes" placeholder="General Notes..." rows="3"></textarea>
    </fieldset>

    <fieldset style="display:grid; gap:8px; border:1px solid #444; padding:12px; margin-bottom:12px; border-radius:6px;">
      <legend style="font-weight:bold;">Preferences</legend>
      <input name="pref_colors" placeholder="Colors (comma separated)" />
      <input name="pref_brands" placeholder="Brands (comma separated)" />
      <input name="pref_foods" placeholder="Foods (comma separated)" />
      <input name="pref_music" placeholder="Music/Artists (comma separated)" />
      <input name="pref_movies" placeholder="Movies/Shows (comma separated)" />
      <input name="pref_games" placeholder="Games (comma separated)" />
      <input name="pref_scents" placeholder="Scents (comma separated)" />
      <select name="pref_giftType">
        <option value="">-- Gift Preference --</option>
        <option value="experiences">Experiences</option>
        <option value="physical">Physical Gifts</option>
        <option value="either">Either</option>
      </select>
    </fieldset>

    <fieldset style="display:grid; gap:8px; border:1px solid #444; padding:12px; margin-bottom:12px; border-radius:6px;">
      <legend style="font-weight:bold;">Personality</legend>
      <input name="pers_mbti" placeholder="MBTI (e.g., INTJ)" />
      <input name="pers_loveLanguage" placeholder="Love Language (e.g., Acts of Service)" />
      <input name="pers_humorStyle" placeholder="Humor Style (e.g., Dry, Sarcastic)" />
      <select name="pers_energyType">
        <option value="">-- Energy Type --</option>
        <option value="introvert">Introvert</option>
        <option value="extrovert">Extrovert</option>
        <option value="ambivert">Ambivert</option>
      </select>
      <input name="pers_coreValues" placeholder="Core Values (comma separated)" />
    </fieldset>

    <fieldset style="display:grid; gap:8px; border:1px solid #444; padding:12px; border-radius:6px;">
      <legend style="font-weight:bold;">Social & Relationship</legend>
      <input name="soc_howWeMet" placeholder="How we met" />
      <select name="soc_relationshipType">
        <option value="">-- Relationship Type --</option>
        <option value="friend">Friend</option>
        <option value="family">Family</option>
        <option value="colleague">Colleague</option>
      </select>
      <input name="soc_insideJokes" placeholder="Inside Jokes (comma separated)" />
      <input name="soc_topicsToAvoid" placeholder="Topics to Avoid (comma separated)" />
      <div style="display:flex; gap:8px;">
        <input name="soc_ig" placeholder="Instagram Handle" style="flex:1;" />
        <input name="soc_discord" placeholder="Discord Handle" style="flex:1;" />
      </div>
      <label style="display:flex; flex-direction:column; font-size:0.9em;">
        Last Contact
        <input name="soc_lastContact" type="date" />
      </label>
    </fieldset>
  `;
}

function extractProfileFormData(fd) {
  return {
    name: fd.get("name"),
    birthday: fd.get("birthday") || null,
    notes: fd.get("notes"),
    tags: parseCommaList(fd.get("tags")),
    dislikes: parseCommaList(fd.get("dislikes")),
    
    preferences: {
      colors: parseCommaList(fd.get("pref_colors")),
      brands: parseCommaList(fd.get("pref_brands")),
      foods: parseCommaList(fd.get("pref_foods")),
      music: parseCommaList(fd.get("pref_music")),
      movies: parseCommaList(fd.get("pref_movies")),
      games: parseCommaList(fd.get("pref_games")),
      scents: parseCommaList(fd.get("pref_scents")),
      giftType: fd.get("pref_giftType") || "",
    },
    
    personality: {
      mbti: fd.get("pers_mbti") || "",
      loveLanguage: fd.get("pers_loveLanguage") || "",
      humorStyle: fd.get("pers_humorStyle") || "",
      energyType: fd.get("pers_energyType") || "",
      coreValues: parseCommaList(fd.get("pers_coreValues")),
    },
    
    social: {
      howWeMet: fd.get("soc_howWeMet") || "",
      relationshipType: fd.get("soc_relationshipType") || "",
      insideJokes: parseCommaList(fd.get("soc_insideJokes")),
      topicsToAvoid: parseCommaList(fd.get("soc_topicsToAvoid")),
      handles: {
        instagram: fd.get("soc_ig") || "",
        discord: fd.get("soc_discord") || "",
      },
      lastContact: fd.get("soc_lastContact") || null,
    }
  };
}

export async function renderProfilesPage(rootEl, user) {
  let currentProfiles = [];
  let selectedTagFilter = "";

  rootEl.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <h1 title="Go Home" id="appTitle" style="margin:0; cursor:pointer;">HumanDB</h1>
      <div style="opacity:0.8;">Logged in as ${htmlEscape(user.displayName)}</div>
    </div>
    <hr />

    <div id="mainView">
      <details style="margin-bottom: 20px;">
        <summary style="font-size: 1.2em; font-weight: bold; cursor: pointer; padding: 8px 0;">+ Add a profile</summary>
        <form id="createProfileForm" style="display:flex; flex-direction:column; gap:8px; max-width:600px; margin-top: 10px;">
          ${renderFieldsetHTML(false)}
          <button type="submit" style="padding:10px; font-size:1.1em; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer;">Create Profile</button>
          <div id="formMsg" style="min-height:20px; color: #4CAF50; font-weight:bold;"></div>
        </form>
      </details>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 style="margin:0;">Your profiles</h2>
        <div style="display:flex; gap: 8px; align-items:center;">
          <label for="tagFilter" style="font-size: 0.9em;">Filter:</label>
          <select id="tagFilter" style="padding:4px;">
            <option value="">All Tags</option>
          </select>
        </div>
      </div>
      <div id="profilesList" style="display:grid; gap:10px; margin-top:12px;"></div>
    </div>

    <div id="detailView" style="display:none;"></div>

    <dialog id="editModal" style="padding: 20px; border-radius: 8px; border: 1px solid #555; max-width: 95vw; width: 600px; background: #222; color: #eee;">
      <h2 style="margin-top:0;">Edit Profile</h2>
      <form id="editProfileForm" style="display:flex; flex-direction:column; gap:8px;">
        <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
          ${renderFieldsetHTML(true)}
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <button type="button" id="closeEditModalBtn" style="padding:8px 16px;">Cancel</button>
          <button type="submit" style="padding:8px 16px; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer;">Save Changes</button>
        </div>
        <div id="editFormMsg" style="min-height:20px; color: #ff8888; font-weight:bold;"></div>
      </form>
    </dialog>
  `;

  const mainView = rootEl.querySelector("#mainView");
  const detailView = rootEl.querySelector("#detailView");
  const listEl = rootEl.querySelector("#profilesList");
  const form = rootEl.querySelector("#createProfileForm");
  const msgEl = rootEl.querySelector("#formMsg");
  const appTitle = rootEl.querySelector("#appTitle");
  const tagFilterEl = rootEl.querySelector("#tagFilter");

  const editModal = rootEl.querySelector("#editModal");
  const editForm = rootEl.querySelector("#editProfileForm");
  const closeEditModalBtn = rootEl.querySelector("#closeEditModalBtn");
  const editFormMsg = rootEl.querySelector("#editFormMsg");

  appTitle.addEventListener("click", () => {
    detailView.style.display = "none";
    mainView.style.display = "block";
    refresh();
  });

  tagFilterEl.addEventListener("change", (e) => {
    selectedTagFilter = e.target.value;
    renderList();
  });

  async function showProfileDetail(id) {
    const p = await getProfileById(id);
    if (!p) return;

    mainView.style.display = "none";
    detailView.style.display = "block";

    const hasPrefs = Object.values(p.preferences || {}).some(v => Array.isArray(v) ? v.length : !!v);
    const hasPers = Object.values(p.personality || {}).some(v => Array.isArray(v) ? v.length : !!v);
    const hasSoc = Object.values(p.social || {}).some(v => {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return Object.values(v).some(x => !!x);
      }
      return Array.isArray(v) ? v.length : !!v;
    });

    const arrToStr = (arr) => Array.isArray(arr) && arr.length ? htmlEscape(arr.join(", ")) : "";
    const listProp = (label, val) => val ? `<div><strong>${label}:</strong> ${htmlEscape(val)}</div>` : "";
    const listArr = (label, arr) => arrToStr(arr) ? `<div><strong>${label}:</strong> ${arrToStr(arr)}</div>` : "";

    detailView.innerHTML = `
      <button id="backBtn" style="margin-bottom: 20px; cursor:pointer;">&larr; Back to Profiles</button>
      <div style="border: 1px solid #444; border-radius: 10px; padding: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; gap: 20px; align-items:center;">
            ${p.pfp 
              ? `<img src="${htmlEscape(p.pfp)}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #555;" />` 
              : `<div style="width: 100px; height: 100px; border-radius: 50%; background: #333; display:flex; align-items:center; justify-content:center; font-size: 2.5em; opacity: 0.5;">?</div>`
            }
            <div>
              <h1 style="margin:0; font-size: 2.2em;">${htmlEscape(p.name)}</h1>
              ${p.tags?.length ? `<div style="margin-top: 8px; display:flex; gap:6px; flex-wrap:wrap;">${p.tags.map(t => `<span style="background:#444; padding:2px 8px; border-radius:12px; font-size:0.85em;">${htmlEscape(t)}</span>`).join("")}</div>` : ""}
            </div>
          </div>
          <div>
            <button id="detailEditBtn" style="cursor:pointer; padding:6px 12px;">Edit Profile</button>
            <button id="detailDeleteBtn" style="background:#cc3333; color:white; border:none; padding:6px 12px; border-radius:4px; margin-left:8px; cursor:pointer;">Delete</button>
          </div>
        </div>
        <hr style="margin: 24px 0; border:none; border-top: 1px solid #444;" />
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;">
          <div>
            <h3 style="margin-top:0; border-bottom:1px solid #555; padding-bottom:4px;">Basic Info</h3>
            <div style="display:grid; gap:6px;">
              ${listProp("Birthday", p.birthday)}
              ${listArr("Dislikes", p.dislikes)}
              ${p.notes ? `<div><strong>Notes:</strong><br/><span style="white-space:pre-wrap; opacity:0.9;">${htmlEscape(p.notes)}</span></div>` : ""}
            </div>
          </div>

          ${hasPrefs ? `
          <div>
            <h3 style="margin-top:0; border-bottom:1px solid #555; padding-bottom:4px;">Preferences</h3>
            <div style="display:grid; gap:6px;">
              ${listArr("Colors", p.preferences.colors)}
              ${listArr("Brands", p.preferences.brands)}
              ${listArr("Foods", p.preferences.foods)}
              ${listArr("Music", p.preferences.music)}
              ${listArr("Movies", p.preferences.movies)}
              ${listArr("Games", p.preferences.games)}
              ${listArr("Scents", p.preferences.scents)}
              ${listProp("Gift Type", p.preferences.giftType)}
            </div>
          </div>` : ""}

          ${hasPers ? `
          <div>
            <h3 style="margin-top:0; border-bottom:1px solid #555; padding-bottom:4px;">Personality</h3>
            <div style="display:grid; gap:6px;">
              ${listProp("MBTI", p.personality.mbti)}
              ${listProp("Energy Type", p.personality.energyType)}
              ${listProp("Love Language", p.personality.loveLanguage)}
              ${listProp("Humor Style", p.personality.humorStyle)}
              ${listArr("Core Values", p.personality.coreValues)}
            </div>
          </div>` : ""}

          ${hasSoc ? `
          <div>
            <h3 style="margin-top:0; border-bottom:1px solid #555; padding-bottom:4px;">Social</h3>
            <div style="display:grid; gap:6px;">
              ${listProp("Relationship", p.social.relationshipType)}
              ${listProp("How We Met", p.social.howWeMet)}
              ${listProp("Last Contact", p.social.lastContact)}
              ${listArr("Inside Jokes", p.social.insideJokes)}
              ${listArr("Topics to Avoid", p.social.topicsToAvoid)}
              ${p.social.handles?.instagram ? `<div><strong>IG:</strong> ${htmlEscape(p.social.handles.instagram)}</div>` : ""}
              ${p.social.handles?.discord ? `<div><strong>Discord:</strong> ${htmlEscape(p.social.handles.discord)}</div>` : ""}
            </div>
          </div>` : ""}
        </div>
      </div>
    `;

    detailView.querySelector("#backBtn").addEventListener("click", () => {
      detailView.style.display = "none";
      mainView.style.display = "block";
      refresh();
    });

    detailView.querySelector("#detailEditBtn").addEventListener("click", () => {
      openEditModal(p);
    });

    detailView.querySelector("#detailDeleteBtn").addEventListener("click", async () => {
      if (!confirm("Delete this profile?")) return;
      await deleteProfile(p.id);
      detailView.style.display = "none";
      mainView.style.display = "block";
      refresh();
    });
  }

  function openEditModal(p) {
    editForm.reset();
    editFormMsg.textContent = "";
    const f = editForm.elements;
    
    f["id"].value = p.id;
    f["name"].value = p.name || "";
    f["birthday"].value = p.birthday || "";
    f["tags"].value = Array.isArray(p.tags) ? p.tags.join(", ") : "";
    f["dislikes"].value = Array.isArray(p.dislikes) ? p.dislikes.join(", ") : "";
    f["notes"].value = p.notes || "";

    const pref = p.preferences || {};
    f["pref_colors"].value = Array.isArray(pref.colors) ? pref.colors.join(", ") : "";
    f["pref_brands"].value = Array.isArray(pref.brands) ? pref.brands.join(", ") : "";
    f["pref_foods"].value = Array.isArray(pref.foods) ? pref.foods.join(", ") : "";
    f["pref_music"].value = Array.isArray(pref.music) ? pref.music.join(", ") : "";
    f["pref_movies"].value = Array.isArray(pref.movies) ? pref.movies.join(", ") : "";
    f["pref_games"].value = Array.isArray(pref.games) ? pref.games.join(", ") : "";
    f["pref_scents"].value = Array.isArray(pref.scents) ? pref.scents.join(", ") : "";
    f["pref_giftType"].value = pref.giftType || "";

    const pers = p.personality || {};
    f["pers_mbti"].value = pers.mbti || "";
    f["pers_loveLanguage"].value = pers.loveLanguage || "";
    f["pers_humorStyle"].value = pers.humorStyle || "";
    f["pers_energyType"].value = pers.energyType || "";
    f["pers_coreValues"].value = Array.isArray(pers.coreValues) ? pers.coreValues.join(", ") : "";

    const soc = p.social || {};
    const handles = soc.handles || {};
    f["soc_howWeMet"].value = soc.howWeMet || "";
    f["soc_relationshipType"].value = soc.relationshipType || "";
    f["soc_insideJokes"].value = Array.isArray(soc.insideJokes) ? soc.insideJokes.join(", ") : "";
    f["soc_topicsToAvoid"].value = Array.isArray(soc.topicsToAvoid) ? soc.topicsToAvoid.join(", ") : "";
    f["soc_ig"].value = handles.instagram || "";
    f["soc_discord"].value = handles.discord || "";
    f["soc_lastContact"].value = soc.lastContact || "";

    editModal.showModal();
  }

  closeEditModalBtn.addEventListener("click", () => {
    editModal.close();
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    editFormMsg.textContent = "Saving...";
    const fd = new FormData(editForm);
    const id = fd.get("id");

    const patch = extractProfileFormData(fd);

    const pfpFile = fd.get("pfp");
    if (pfpFile && pfpFile.size > 0) {
      try {
        const url = await uploadProfilePicture(user.uid, pfpFile);
        if (url) patch.pfp = url;
      } catch (e) {
        console.error("Failed to upload pfp", e);
        editFormMsg.textContent = "Failed to upload picture. Saving rest...";
      }
    }

    try {
      await updateProfile(id, patch);
      editModal.close();
      
      if (detailView.style.display === "block") {
        await showProfileDetail(id);
      } else {
        await refresh();
      }
    } catch (err) {
      editFormMsg.textContent = err?.message ?? "Failed to update profile";
    }
  });

  function updateTagFilterDropdown() {
    const allTags = new Set();
    currentProfiles.forEach(p => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => allTags.add(t));
      }
    });

    const sortedTags = Array.from(allTags).sort();
    
    // Preserve current selection if possible
    let optionsHTML = '<option value="">All Tags</option>';
    sortedTags.forEach(t => {
      const selected = selectedTagFilter === t ? "selected" : "";
      optionsHTML += `<option value="${htmlEscape(t)}" ${selected}>${htmlEscape(t)}</option>`;
    });
    
    tagFilterEl.innerHTML = optionsHTML;
  }

  function renderList() {
    let listToRender = currentProfiles;

    // Apply tag filter
    if (selectedTagFilter) {
      listToRender = listToRender.filter(p => 
        Array.isArray(p.tags) && p.tags.includes(selectedTagFilter)
      );
    }

    if (!listToRender.length) {
      if (selectedTagFilter) {
        listEl.innerHTML = `<p style="opacity:0.7;">No profiles match the tag "${htmlEscape(selectedTagFilter)}".</p>`;
      } else {
        listEl.innerHTML = `<p style="opacity:0.7;">No profiles yet. Add one above.</p>`;
      }
      return;
    }

    listEl.innerHTML = listToRender
      .map((p) => {
        return `
          <div data-id="${p.id}" style="border:1px solid #333; border-radius:10px; padding:12px; cursor:pointer; background:rgba(255,255,255,0.03);" class="profileCard">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
              <div style="display:flex; gap:16px; align-items:center;">
                ${p.pfp 
                  ? `<img src="${htmlEscape(p.pfp)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />` 
                  : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #444; display:flex; align-items:center; justify-content:center; font-size: 1.2em; opacity: 0.8;">?</div>`
                }
                <div>
                  <strong style="font-size:1.1em;">${htmlEscape(p.name)}</strong>
                  ${p.personality?.mbti ? `<span style="opacity:0.6; font-size:0.9em; margin-left:6px;">(${htmlEscape(p.personality.mbti)})</span>` : ""}
                  ${p.tags?.length ? `<div style="margin-top:4px; display:flex; gap:4px; flex-wrap:wrap;">${p.tags.slice(0, 3).map(t => `<span style="background:#555; padding:1px 6px; border-radius:8px; font-size:0.75em;">${htmlEscape(t)}</span>`).join("")}${p.tags.length > 3 ? '<span style="font-size:0.8em; opacity:0.6;">...</span>' : ''}</div>` : ""}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");

    listEl.querySelectorAll(".profileCard").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-actions")) return;
        const id = card.getAttribute("data-id");
        if (id) showProfileDetail(id);
      });
    });
  }

  async function refresh() {
    currentProfiles = await listProfiles(user.uid);
    updateTagFilterDropdown();
    renderList();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "Creating Profile...";

    const fd = new FormData(form);
    const payload = extractProfileFormData(fd);

    let pfp = null;
    const pfpFile = fd.get("pfp");
    if (pfpFile && pfpFile.size > 0) {
      try {
        pfp = await uploadProfilePicture(user.uid, pfpFile);
      } catch (err) {
        console.error("PFP upload error", err);
      }
    }

    if (pfp) {
      payload.pfp = pfp;
    }

    try {
      await createProfile(user.uid, payload);
      form.reset();
      msgEl.textContent = "Profile Created ✅";
      setTimeout(() => msgEl.textContent = "", 3000);
      
      // Auto close the details element
      const detailsEl = rootEl.querySelector("details");
      if (detailsEl) detailsEl.removeAttribute("open");
      
      await refresh();
    } catch (err) {
      msgEl.textContent = err?.message ?? "Failed to create profile";
    }
  });

  await refresh();
}
