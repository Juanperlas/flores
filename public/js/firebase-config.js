// public/js/firebase-config.js

// Importamos las funciones que necesitamos de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Tu configuración de Firebase que nos compartiste
const firebaseConfig = {
  apiKey: "AIzaSyCaTaZqTSs75KnXvMaVRlIG3YLDMFX89wY",
  authDomain: "flores-78147.firebaseapp.com",
  projectId: "flores-78147",
  storageBucket: "flores-78147.firebasestorage.app", // Corregí esto al formato estándar, el tuyo podría ser diferente si lo cambiaste
  messagingSenderId: "486234583967",
  appId: "1:486234583967:web:3a55987be76e74e7dfc3aa",
};

// --- No modifiques el código debajo de esta línea ---

// Inicializamos la app de Firebase
const app = initializeApp(firebaseConfig);

// Obtenemos acceso a Firestore y Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Exportamos las variables para poder usarlas en otros archivos
export { db, storage };
