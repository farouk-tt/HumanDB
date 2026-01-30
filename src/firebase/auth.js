import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./init";

const provider = new GoogleAuthProvider();

export function login() {
    return signInWithPopup(auth, provider);
}

export function logout() {
    return signOut(auth);
}

export function onUserChanged(cb) {
    return onAuthStateChanged(auth, cb);
}
