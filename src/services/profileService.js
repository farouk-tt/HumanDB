import { db } from "../firebase/init";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { storage } from "../firebase/init";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const PROFILES = "profiles";

function normalizeProfileInput(data = {}) {
    const prefs = data.preferences || {};
    const pers = data.personality || {};
    const soc = data.social || {};
    const handles = soc.handles || {};

    return {
        name: (data.name ?? "").trim(),
        birthday: data.birthday ?? null,
        pfp: data.pfp ?? null,
        
        preferences: {
            colors: Array.isArray(prefs.colors) ? prefs.colors : [],
            brands: Array.isArray(prefs.brands) ? prefs.brands : [],
            foods: Array.isArray(prefs.foods) ? prefs.foods : [],
            music: Array.isArray(prefs.music) ? prefs.music : [],
            movies: Array.isArray(prefs.movies) ? prefs.movies : [],
            games: Array.isArray(prefs.games) ? prefs.games : [],
            scents: Array.isArray(prefs.scents) ? prefs.scents : [],
            giftType: (prefs.giftType ?? "").trim(),
        },
        
        personality: {
            mbti: (pers.mbti ?? "").trim(),
            loveLanguage: (pers.loveLanguage ?? "").trim(),
            humorStyle: (pers.humorStyle ?? "").trim(),
            energyType: (pers.energyType ?? "").trim(),
            coreValues: Array.isArray(pers.coreValues) ? pers.coreValues : [],
        },

        social: {
            howWeMet: (soc.howWeMet ?? "").trim(),
            relationshipType: (soc.relationshipType ?? "").trim(),
            insideJokes: Array.isArray(soc.insideJokes) ? soc.insideJokes : [],
            topicsToAvoid: Array.isArray(soc.topicsToAvoid) ? soc.topicsToAvoid : [],
            handles: {
                instagram: (handles.instagram ?? "").trim(),
                discord: (handles.discord ?? "").trim(),
            },
            lastContact: soc.lastContact ?? null,
        },

        notes: (data.notes ?? "").trim(),
        tags: Array.isArray(data.tags) ? data.tags : [],
        dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
        // Legacy fields for backward compatibility, will be ignored if not present
        favorites: Array.isArray(data.favorites) ? data.favorites : [],
    };
}

export async function createProfile(uid, data) {
const payload = normalizeProfileInput(data);

if (!uid) throw new Error("Missing uid");
if (!payload.name) throw new Error("Profile name is required");

const ref = await addDoc(collection(db, PROFILES), {
    ...payload,
    ownerId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
});

return ref.id;
}

export async function listProfiles(uid) {
    if (!uid) throw new Error("Missing uid");

    const q = query(
    collection(db, PROFILES),
    where("ownerId", "==", uid),
    orderBy("name")
);

const snap = await getDocs(q);
return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProfileById(profileId) {
const ref = doc(db, PROFILES, profileId);
const snap = await getDoc(ref);
if (!snap.exists()) return null;
return { id: snap.id, ...snap.data() };
}

export async function updateProfile(profileId, patch) {
    const ref = doc(db, PROFILES, profileId);

    const safePatch = { ...patch };
    delete safePatch.ownerId;
    delete safePatch.createdAt;

    await updateDoc(ref, {
    ...safePatch,
    updatedAt: serverTimestamp(),
});
}

export async function deleteProfile(profileId) {
const ref = doc(db, PROFILES, profileId);
await deleteDoc(ref);
}

export async function uploadProfilePicture(uid, file) {
    if (!uid || !file) return null;
    const path = `profiles/${uid}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, path);
    await uploadBytes(sRef, file);
    return await getDownloadURL(sRef);
}
