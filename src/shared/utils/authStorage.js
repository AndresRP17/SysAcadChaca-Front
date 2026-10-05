// El login guarda la sesión en localStorage (persiste al cerrar el navegador)
// o en sessionStorage (solo dura la pestaña actual) según el checkbox
// "Recordarme en este equipo". Todo lo que lee/escribe token o user pasa por
// acá para no tener que saber en cuál de los dos vive.
const KEYS = ["token", "user"];

function clearBoth() {
  KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export const authStorage = {
  save(token, user, remember) {
    clearBoth();
    const store = remember ? localStorage : sessionStorage;
    if (token) store.setItem("token", token);
    if (user) store.setItem("user", JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  },

  getUser() {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  clear: clearBoth,
};
