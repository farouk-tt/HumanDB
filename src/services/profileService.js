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

const PROFILES = "profiles";

function normalizeProfileInput(data = {}) {
    return {
    name: (data.name ?? "").trim(),
    birthday: data.birthday ?? null,
    personality: (data.personality ?? "").trim(),
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    games: Array.isArray(data.games) ? data.games : [],
    dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
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
