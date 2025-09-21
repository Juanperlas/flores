// public/js/flores.js

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const openGiftBtn = document.getElementById("open-gift-btn");
  const giftOverlay = document.getElementById("gift-overlay");
  const giftBox = document.querySelector(".gift-box");
  const countdownElement = document.querySelector(".gift-icon");

  const params = new URLSearchParams(window.location.search);
  const creationId = params.get("id");

  if (!creationId) {
    displayError(
      "No se encontró un ID en la URL. El enlace parece estar roto."
    );
    return;
  }

  // Lógica del clic en el regalo
  openGiftBtn.addEventListener("click", async () => {
    // 1. Deshabilitamos el botón para evitar múltiples clics
    openGiftBtn.disabled = true;

    // 2. Inicia la carga de datos en segundo plano
    // El .then() asegura que la página se llene cuando los datos lleguen,
    // sin detener la animación.
    loadCreation(creationId).then((data) => {
      if (data) {
        populatePage(data);
      }
    });

    // 3. Inicia la animación de conteo de 3 segundos
    giftBox.style.animation = "none"; // Detenemos la animación de pulso
    countdownElement.style.fontSize = "clamp(120px, 40vw, 220px)";
    openGiftBtn.style.opacity = "0";

    await sleep(200); // Pequeña pausa
    countdownElement.textContent = "3";
    await sleep(1000);
    countdownElement.textContent = "2";
    await sleep(1000);
    countdownElement.textContent = "1";
    await sleep(1000);

    // 4. Ocultamos la pantalla de regalo y revelamos el contenido
    giftOverlay.classList.add("hidden");
  });
});

async function loadCreation(id) {
  try {
    const docRef = doc(db, "creations", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data(); // Devolvemos los datos
    } else {
      displayError(
        "¡Oh no! Esta creación no fue encontrada. Revisa el enlace."
      );
      return null;
    }
  } catch (error) {
    console.error("Error al cargar la creación:", error);
    displayError("Ocurrió un error al cargar tu regalo.");
    return null;
  }
}

// Función auxiliar para pausas
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function displayError(message) {
  document.body.innerHTML = `<div class="error-container"><h1>😕</h1><p>${message}</p></div>`;
  const style = document.createElement("style");
  style.textContent = `
        .error-container { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100vh; background: #f3f3f3; color: #333; font-family: 'Poppins', sans-serif; padding: 20px; }
        .error-container h1 { font-size: 5rem; margin: 0; }
    `;
  document.head.appendChild(style);
}

// =========================================================================
// FUNCIONES DE RENDERIZADO Y LÓGICA DE LA PÁGINA
// =========================================================================
let player;

function populatePage(data) {
  // Ahora la música se carga desde aquí, una vez que tenemos la URL
  window.onYouTubeIframeAPIReady = function () {
    triggerMusicLoad(data.body.musicUrl);
  };
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // Poblar los datos de la página
  document.getElementById("stage-body").className =
    "stage-body " + data.body.theme;
  document.getElementById("intro-main-message").innerText =
    data.intro.mainMessage;
  document.getElementById("sender-name").innerText = data.intro.senderName;
  document.getElementById("receiver-name").innerText = data.intro.receiverName;
  document.getElementById("intro-secondary-message").innerText =
    data.intro.secondaryMessage;
  document.getElementById("body-main-title").innerText = data.body.title;

  renderImageCarousel(data.body.images);
  renderModalMessages(data.body.messages);
  startFallingElements(data.body.fallingElement);

  const firstImageUrl =
    data.body.images && data.body.images.length > 0
      ? data.body.images[0]
      : "assets/default-image.png";
  setupMusicDisc(firstImageUrl);
  setupEventListeners();
}

function triggerMusicLoad(youtubeUrl) {
  const videoId = youtubeUrl.match(
    /(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|#|$)/
  )?.[1];
  if (!videoId) return;
  if (window.player) window.player.destroy();
  window.player = new YT.Player("youtube-player", {
    height: "1",
    width: "1",
    videoId: videoId,
    playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
    events: {
      onReady: (e) => e.target.playVideo(),
      onStateChange: onPlayerStateChange,
    },
  });
}

// --- El resto de funciones (onPlayerStateChange, setupEventListeners, etc.) no cambian ---
function onPlayerStateChange(event) {
  updatePlayState(event.data);
}

function setupEventListeners() {
  const pre1View = document.getElementById("pre-1-view");
  const pre2View = document.getElementById("pre-2-view");
  const nextViewBtn = document.getElementById("next-view-btn");
  const musicDiscBtn = document.getElementById("music-disc-btn");
  const musicModal = document.getElementById("music-modal");

  nextViewBtn.addEventListener("click", () => {
    pre1View.style.opacity = 0;
    setTimeout(() => {
      pre1View.classList.add("hidden");
      pre2View.classList.remove("hidden");
      setTimeout(() => {
        pre2View.style.opacity = 1;
      }, 50);
    }, 500);
  });

  musicDiscBtn.addEventListener("click", openMusicModal);
  musicModal
    .querySelector(".close-button")
    .addEventListener("click", closeMusicModal);
  musicModal.addEventListener("click", (e) => {
    if (e.target === musicModal) closeMusicModal();
  });
}

function setupMusicDisc(imageUrl) {
  const discBtn = document.getElementById("music-disc-btn");
  discBtn.style.backgroundImage = `url(${imageUrl})`;
  discBtn.classList.remove("hidden");
}

function openMusicModal() {
  const musicModal = document.getElementById("music-modal");
  musicModal.classList.remove("hidden");
  if (!window.player || typeof window.player.getPlayerState !== "function")
    return;
  const videoData = window.player.getVideoData();
  const duration = window.player.getDuration();
  document.getElementById("music-title").innerText =
    videoData.title || "Canción cargada";
  const firstImageUrl =
    document.getElementById("music-disc-btn").style.backgroundImage;
  document.getElementById("music-disc-large").style.backgroundImage =
    firstImageUrl;
  const progressBar = document.getElementById("progress-bar");
  progressBar.max = duration;
  document.getElementById("play-pause-modal").onclick = () => {
    if (window.player.getPlayerState() === YT.PlayerState.PLAYING)
      window.player.pauseVideo();
    else window.player.playVideo();
  };
  document.getElementById("rewind-5s").onclick = () =>
    window.player.seekTo(window.player.getCurrentTime() - 5, true);
  document.getElementById("forward-5s").onclick = () =>
    window.player.seekTo(window.player.getCurrentTime() + 5, true);
  progressBar.oninput = () => window.player.seekTo(progressBar.value, true);
  updateProgress();
  window.progressInterval = setInterval(updateProgress, 500);
}

function closeMusicModal() {
  document.getElementById("music-modal").classList.add("hidden");
  clearInterval(window.progressInterval);
}

function updateProgress() {
  if (!window.player || typeof window.player.getCurrentTime !== "function")
    return;
  const currentTime = window.player.getCurrentTime();
  const duration = window.player.getDuration();
  document.getElementById("progress-bar").value = currentTime;
  document.getElementById("current-time").innerText = formatTime(currentTime);
  document.getElementById("duration-time").innerText = formatTime(duration);
}

function updatePlayState(state) {
  const isPlaying = state === YT.PlayerState.PLAYING;
  const discBtn = document.getElementById("music-disc-btn");
  const discLarge = document.getElementById("music-disc-large");
  const playPauseBtn = document.getElementById("play-pause-modal");
  if (isPlaying) {
    discBtn.classList.add("playing");
    discLarge.classList.add("playing");
    playPauseBtn.innerText = "⏸️";
  } else {
    discBtn.classList.remove("playing");
    discLarge.classList.remove("playing");
    playPauseBtn.innerText = "▶️";
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

let fallingInterval;
function startFallingElements(elementValue) {
  if (fallingInterval) clearInterval(fallingInterval);
  const container = document.getElementById("falling-elements-container");
  container.innerHTML = "";
  fallingInterval = setInterval(() => {
    let element;
    if (elementValue.includes(".gif")) {
      element = document.createElement("img");
      element.src = elementValue;
      element.className = "falling-gif";
    } else {
      element = document.createElement("div");
      element.textContent = elementValue;
      element.className = "falling-emoji";
    }
    element.style.left = `${Math.random() * 100}vw`;
    const duration = Math.random() * 5 + 7;
    element.style.animationDuration = `${duration}s`;
    container.appendChild(element);
    setTimeout(() => {
      element.remove();
    }, duration * 1000);
  }, 300);
}

function renderImageCarousel(images) {
  const carouselContainer = document.getElementById("image-carousel-container");
  const imageCarousel = document.getElementById("image-carousel");
  if (!carouselContainer || !imageCarousel) return;
  imageCarousel.innerHTML = "";
  const finalImages =
    images && images.length > 0 ? images : ["assets/default-image.png"];
  carouselContainer.classList.remove("hidden");
  imageCarousel.classList.add("fade");
  finalImages.forEach((url, index) => {
    const img = document.createElement("img");
    img.src = url;
    img.classList.toggle("active", index === 0);
    imageCarousel.appendChild(img);
  });
  let currentIndex = 0;
  setInterval(() => {
    const imgs = imageCarousel.querySelectorAll("img");
    if (imgs.length > 0) {
      imgs[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % finalImages.length;
      imgs[currentIndex].classList.add("active");
    }
  }, 3000);
}

function renderModalMessages(messages) {
  const messagesModal = document.getElementById("messages-modal");
  const carousel = document.getElementById("modal-messages-carousel");
  const openBtn = document.getElementById("open-messages-modal-btn");
  const prevBtn = document.getElementById("prev-message-btn");
  const nextBtn = document.getElementById("next-message-btn");
  if (!openBtn || !carousel || !messagesModal) return;
  openBtn.onclick = () => messagesModal.classList.remove("hidden");
  messagesModal.querySelector(".close-button").onclick = () =>
    messagesModal.classList.add("hidden");
  carousel.innerHTML = "";
  if (!messages || messages.length === 0) {
    openBtn.classList.add("hidden");
    return;
  }
  openBtn.classList.remove("hidden");
  messages.forEach((msg) => {
    const card = document.createElement("div");
    card.className = "modal-message-card";
    card.textContent = msg;
    carousel.appendChild(card);
  });
  let currentMessageIndex = 0;
  const showMessage = (index) => {
    carousel.style.transform = `translateX(-${index * 100}%)`;
  };
  prevBtn.onclick = () => {
    currentMessageIndex =
      (currentMessageIndex - 1 + messages.length) % messages.length;
    showMessage(currentMessageIndex);
  };
  nextBtn.onclick = () => {
    currentMessageIndex = (currentMessageIndex + 1) % messages.length;
    showMessage(currentMessageIndex);
  };
  if (messages.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
  } else {
    prevBtn.style.display = "block";
    nextBtn.style.display = "block";
  }
  showMessage(0);
}
