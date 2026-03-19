import "./style.css";
import { login, logout, onUserChanged } from "./firebase/auth";
import { renderProfilesPage } from "./pages/profiles";

const app = document.querySelector("#app");

onUserChanged(async (user) => {
  if (!user) {
    app.innerHTML = `
      <h1>HumanDB</h1>
      <button id="login">Login with Google</button>
    `;
    document.querySelector("#login").onclick = login;
    return;
  }

  app.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
      <div></div>
      <button id="logout">Logout</button>
    </div>
    <div id="page"></div>
  `;

  document.querySelector("#logout").onclick = logout;

  const page = document.querySelector("#page");
  await renderProfilesPage(page, user);
});
