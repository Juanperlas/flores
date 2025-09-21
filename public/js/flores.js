// public/js/flores.js

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Variables globales para guardar los datos de la canción de forma segura
let player;
let currentSongTitle = "Cargando...";
let currentSongDuration = 0;

document.addEventListener("DOMContentLoaded", () => {
  const openGiftBtn = document.getElementById("open-gift-btn");
  const giftOverlay = document.getElementById("gift-overlay");
  const giftBox = document.querySelector(".gift-box");

  const params = new URLSearchParams(window.location.search);
  const creationId = params.get("id");

  if (!creationId) {
    displayError(
      "No se encontró un ID en la URL. El enlace parece estar roto."
    );
    return;
  }

  openGiftBtn.addEventListener("click", async () => {
    openGiftBtn.disabled = true;
    const data = await loadCreation(creationId);
    if (!data) return;

    // Iniciamos la carga de la música AHORA, en segundo plano.
    preloadMusic(data.body.musicUrl);

    // Animación del regalo
    giftBox.style.animation = "none";
    openGiftBtn.style.opacity = "0";
    giftBox.style.transform = "scale(1.1)";
    giftBox.style.filter = "brightness(1.5)";

    await sleep(800);

    giftOverlay.style.opacity = "0";
    giftOverlay.style.transform = "scale(0.95)";

    await sleep(1000);
    giftOverlay.classList.add("hidden");

    // Inicia el video de introducción
    startVideoIntro(data);
  });
});

async function startVideoIntro(data) {
  const videoIntro = document.getElementById("video-intro");
  const introVideo = document.getElementById("intro-video");

  videoIntro.classList.remove("hidden");

  document.getElementById("video-main-message").textContent =
    data.intro.mainMessage;
  document.getElementById(
    "video-sender"
  ).textContent = `De: ${data.intro.senderName}`;
  document.getElementById(
    "video-receiver"
  ).textContent = `Para: ${data.intro.receiverName}`;
  document.getElementById("video-secondary-message").textContent =
    data.intro.secondaryMessage;

  try {
    introVideo.muted = false;
    await introVideo.play();
  } catch (error) {
    console.log("Video autoplay failed, user interaction required");
  }

  // La duración del video vuelve a ser 30 segundos (30000 ms).
  setTimeout(() => {
    videoIntro.style.opacity = "0";
    videoIntro.style.transition = "opacity 1s ease-out";

    setTimeout(() => {
      videoIntro.classList.add("hidden");
      videoIntro.style.opacity = "1";
      videoIntro.style.transition = "";

      populatePage(data);
      showPre2ViewWithAnimation();

      // CAMBIO 2: Inicia la música justo cuando termina el video.
      if (player && typeof player.playVideo === "function") {
        player.playVideo();
      }
    }, 1000);
  }, 30000);

  videoIntro.style.pointerEvents = "none";
}

function preloadMusic(musicUrl) {
  window.onYouTubeIframeAPIReady = () => {
    triggerMusicLoad(musicUrl);
  };

  if (!window.YT || !window.YT.Player) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    triggerMusicLoad(musicUrl);
  }
}

function showPre2ViewWithAnimation() {
  const pre2View = document.getElementById("pre-2-view");
  pre2View.classList.remove("hidden");
  pre2View.classList.add("pre-2-view-entry");
}

async function loadCreation(id) {
  try {
    const docRef = doc(db, "creations", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
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

function populatePage(data) {
  const themeNumber = data.body.theme.replace("theme-", "");
  const dynamicBackground = document.getElementById("dynamic-background");
  dynamicBackground.style.backgroundImage = `url("assets/fondos/fondo${themeNumber}.jpg")`;

  document.getElementById("stage-body").className =
    "stage-body " + data.body.theme;
  document.getElementById("receiver-name-header").innerText =
    "Tus Flores Amarillas " + data.intro.receiverName;

  renderElegantImageCarousel(data.body.images);
  renderModalMessages(data.body.messages);
  startFallingElements(data.body.fallingElement);

  const firstImageUrl =
    data.body.images && data.body.images.length > 0
      ? data.body.images[0]
      : "assets/default-image.png";

  const musicDiscLarge = document.getElementById("music-disc-large");
  if (musicDiscLarge) {
    musicDiscLarge.style.backgroundImage = `url(${firstImageUrl})`;
  }

  setupElegantMusicButton(firstImageUrl);
  setupEventListeners();
}

function renderElegantImageCarousel(images) {
  const carouselContainer = document.getElementById("image-carousel-elegant");
  if (!carouselContainer) return;

  carouselContainer.innerHTML = "";
  const finalImages =
    images && images.length > 0 ? images : ["assets/default-image.png"];

  finalImages.forEach((url, index) => {
    const img = document.createElement("img");
    img.src = url;
    img.classList.add("carousel-image");
    if (index === 0) img.classList.add("active");
    carouselContainer.appendChild(img);
  });

  let currentIndex = 0;
  setInterval(() => {
    const imgs = carouselContainer.querySelectorAll(".carousel-image");
    if (imgs.length > 1) {
      imgs[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % finalImages.length;
      setTimeout(() => {
        imgs[currentIndex].classList.add("active");
      }, 1000);
    }
  }, 5000);
}

function setupElegantMusicButton(imageUrl) {
  const musicBtn = document.getElementById("music-disc-btn");
  const btnBackground = musicBtn.querySelector(".btn-background-image");
  btnBackground.style.backgroundImage = `url(${imageUrl})`;
}

function setupEventListeners() {
  const musicDiscBtn = document.getElementById("music-disc-btn");
  const musicModal = document.getElementById("music-modal");
  const messagesModal = document.getElementById("messages-modal");
  const openMessagesBtn = document.getElementById("open-messages-modal-btn");

  musicDiscBtn.addEventListener("click", openMusicModal);
  musicModal
    .querySelector(".close-button-elegant")
    .addEventListener("click", closeMusicModal);
  musicModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop-elegant")) {
      closeMusicModal();
    }
  });

  openMessagesBtn.addEventListener("click", () => {
    messagesModal.classList.remove("hidden");
  });
  messagesModal.querySelector(".close-button").addEventListener("click", () => {
    messagesModal.classList.add("hidden");
  });
}

function triggerMusicLoad(youtubeUrl) {
  const videoId = youtubeUrl.match(
    /(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|#|$)/
  )?.[1];
  if (!videoId) return;

  if (player) player.destroy();

  player = new window.YT.Player("youtube-player", {
    height: "1",
    width: "1",
    videoId: videoId,
    // CAMBIO 1: Autoplay se pone en 0 para que no suene al cargar.
    playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
    events: {
      onReady: (e) => {}, // Lo dejamos vacío, no queremos que haga nada al estar listo.
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerStateChange(event) {
  if (
    event.data === window.YT.PlayerState.PLAYING ||
    event.data === window.YT.PlayerState.PAUSED ||
    event.data === window.YT.PlayerState.CUED
  ) {
    const videoData = player.getVideoData();
    currentSongTitle = videoData.title;
    currentSongDuration = player.getDuration();
  }
  updatePlayState(event.data);
}

function openMusicModal() {
  const musicModal = document.getElementById("music-modal");
  musicModal.classList.remove("hidden");

  if (!player || typeof player.getPlayerState !== "function") return;

  document.getElementById("music-title").innerText = currentSongTitle;
  document.getElementById("progress-bar").max = currentSongDuration;

  document.getElementById("play-pause-modal").onclick = () => {
    if (player.getPlayerState() === window.YT.PlayerState.PLAYING)
      player.pauseVideo();
    else player.playVideo();
  };
  document.getElementById("rewind-5s").onclick = () =>
    player.seekTo(player.getCurrentTime() - 5, true);
  document.getElementById("forward-5s").onclick = () =>
    player.seekTo(player.getCurrentTime() + 5, true);
  document.getElementById("progress-bar").oninput = (e) =>
    player.seekTo(e.target.value, true);

  if (window.progressInterval) clearInterval(window.progressInterval);
  window.progressInterval = setInterval(updateProgress, 500);

  updateProgress();
  updatePlayState(player.getPlayerState());
}

function closeMusicModal() {
  document.getElementById("music-modal").classList.add("hidden");
  clearInterval(window.progressInterval);
}

function updateProgress() {
  if (
    !player ||
    typeof player.getDuration !== "function" ||
    !player.getCurrentTime
  )
    return;
  const currentTime = player.getCurrentTime();
  const duration = player.getDuration();
  if (isNaN(duration)) return;
  document.getElementById("progress-bar").value = currentTime;
  document.getElementById("current-time").innerText = formatTime(currentTime);
  document.getElementById("duration-time").innerText = formatTime(duration);
}

function updatePlayState(state) {
  const musicDiscBtn = document.getElementById("music-disc-btn");
  const discLarge = document.getElementById("music-disc-large");
  const playPauseBtn = document.getElementById("play-pause-modal");

  if (!window.YT) return;
  const isPlaying = state === window.YT.PlayerState.PLAYING;

  if (isPlaying) {
    musicDiscBtn.classList.add("playing");
    discLarge.classList.add("playing");
    playPauseBtn.innerHTML = "<span>⏸️</span>";
  } else {
    musicDiscBtn.classList.remove("playing");
    discLarge.classList.remove("playing");
    playPauseBtn.innerHTML = "<span>▶️</span>";
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

function renderModalMessages(messages) {
  const carousel = document.getElementById("modal-messages-carousel");
  const openBtn = document.getElementById("open-messages-modal-btn");
  const prevBtn = document.getElementById("prev-message-btn");
  const nextBtn = document.getElementById("next-message-btn");

  if (!carousel || !openBtn) return;

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
