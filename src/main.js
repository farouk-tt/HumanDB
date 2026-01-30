import './style.css'
import {login, logout, onUserChanged} from "./firebase/auth";

const app = document.querySelector("#app");


onUserChanged(user => {
  if (user) {
    app.innerHTML = `
      <h1>HumanDB</h1>
      <p>Logged in as ${user.displayName}</p>
      <button id="logout">Logout</button>
    `;

    document.querySelector("#logout").onclick = logout;
  } else {
    app.innerHTML = `
      <h1>HumanDB</h1>
      <button id="login">Login with Google</button>
    `;

    document.querySelector("#login").onclick = login;
  }
});