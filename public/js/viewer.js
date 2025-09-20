// =================================================================================
// LÓGICA DEL REPRODUCTOR DE YOUTUBE (VERSIÓN FINAL)
// =================================================================================
let player;
let isFirstPlay = true; // <-- La nueva bandera para el toast

function onYouTubeIframeAPIReady() {}

function getYoutubeVideoId(url) {
  if (!url) return null;
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  return url.match(regex) ? url.match(regex)[1] : null;
}

window.triggerMusicLoad = function (youtubeUrl, editorCallback) {
  isFirstPlay = true; // <-- Reseteamos la bandera con cada nueva carga
  const videoId = getYoutubeVideoId(youtubeUrl);
  showToast("Cargando música...", "loading");

  if (!videoId) {
    handlePlayerError(editorCallback, false); // Pasamos 'false' para indicar error
    return;
  }
  if (player) {
    player.destroy();
  }
  player = new YT.Player("youtube-player", {
    height: "1",
    width: "1",
    videoId: videoId,
    playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
    events: {
      onReady: (event) => event.target.playVideo(),
      onStateChange: (event) => {
        const musicControls = document.getElementById("music-controls");
        const playPauseBtn = document.getElementById("play-pause-btn");

        if (event.data === YT.PlayerState.PLAYING) {
          if (isFirstPlay) {
            showToast("¡Música cargada!", "success");
            isFirstPlay = false; // <-- Desactivamos la bandera después del primer play
          }
          musicControls.classList.remove("hidden");
          playPauseBtn.innerHTML = "⏸️";
          if (editorCallback) editorCallback(true); // Pasamos 'true' para indicar éxito
        } else {
          playPauseBtn.innerHTML = "▶️";
        }
      },
      onError: () => handlePlayerError(editorCallback, false),
    },
  });
};

function handlePlayerError(callback, success) {
  showToast("Error en URL. Revisa el enlace.", "error", 5000);
  document.getElementById("music-controls").classList.add("hidden");
  if (player) {
    player.stopVideo(); // <-- Detenemos la música si hay un error
  }
  if (callback) callback(success);
}

// =================================================================================
// LÓGICA DE ELEMENTOS VISUALES (GIFS, CAROUSELS, ETC.)
// =================================================================================
let currentFallingElement = "🌻";

function createFallingElement() {
  const container = document.getElementById("falling-elements-container");
  if (!container) return;

  const elementValue = currentFallingElement;
  let element;

  // Verificamos si es un GIF o un emoji
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
}

document.addEventListener("DOMContentLoaded", () => {
  // Código de inicialización sin cambios...
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  setInterval(createFallingElement, 300);
  const modal = document.getElementById("messages-modal");
  document.getElementById("open-messages-modal-btn").onclick = () =>
    modal.classList.remove("hidden");
  document.querySelector(".close-button").onclick = () =>
    modal.classList.add("hidden");
  modal.onclick = (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  };
  const playPauseBtn = document.getElementById("play-pause-btn");
  const rewindBtn = document.getElementById("rewind-btn");
  const forwardBtn = document.getElementById("forward-btn");

  // Pego el código de los botones aquí para que no tengas que buscarlo
  playPauseBtn.onclick = () => {
    if (!player || typeof player.getPlayerState !== "function") return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  };
  rewindBtn.onclick = () => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    player.seekTo(player.getCurrentTime() - 5, true);
  };
  forwardBtn.onclick = () => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    player.seekTo(player.getCurrentTime() + 5, true);
  };
});

window.updateViewer = function (data) {
  if (data.body.fallingElement !== currentFallingElement) {
    currentFallingElement = data.body.fallingElement;
    document.getElementById("falling-elements-container").innerHTML = "";
  }
  // El resto de la función (sin cambios)...
  const stageBody = document.getElementById("stage-body");
  const pre1View = document.getElementById("pre-1-view");
  const pre2View = document.getElementById("pre-2-view");
  stageBody.className = "stage-body";
  stageBody.classList.add(data.body.theme);
  if (data.view === "intro") {
    pre1View.classList.remove("hidden");
    pre2View.classList.add("hidden");
    if (player && typeof player.pauseVideo === "function") player.pauseVideo();
  } else {
    pre1View.classList.add("hidden");
    pre2View.classList.remove("hidden");
  }
  document.getElementById("intro-main-message").innerText =
    data.intro.mainMessage;
  document.getElementById("sender-name").innerText = data.intro.senderName;
  document.getElementById("receiver-name").innerText = data.intro.receiverName;
  document.getElementById("intro-secondary-message").innerText =
    data.intro.secondaryMessage;
  document.getElementById("body-main-title").innerText = data.body.title;
  renderImageCarousel(data.body.images);
  renderModalMessages(data.body.messages);
};

// Pego el código de las funciones de renderizado aquí para que no tengas que buscarlo
function renderImageCarousel(images) {
  const carouselContainer = document.getElementById("image-carousel-container");
  const imageCarousel = document.getElementById("image-carousel");
  const prevBtn = document.getElementById("prev-image-btn");
  const nextBtn = document.getElementById("next-image-btn");
  imageCarousel.innerHTML = "";
  currentImageIndex = 0;
  const finalImages = images.length > 0 ? images : ["assets/default-image.png"];
  carouselContainer.classList.remove("hidden");
  finalImages.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    imageCarousel.appendChild(img);
  });
  const showImage = (index) => {
    imageCarousel.scrollLeft = index * imageCarousel.offsetWidth;
  };
  prevBtn.onclick = () => {
    currentImageIndex =
      (currentImageIndex - 1 + finalImages.length) % finalImages.length;
    showImage(currentImageIndex);
  };
  nextBtn.onclick = () => {
    currentImageIndex = (currentImageIndex + 1) % finalImages.length;
    showImage(currentImageIndex);
  };
  showImage(0);
}
function renderModalMessages(messages) {
  const messagesBtn = document.getElementById("open-messages-modal-btn");
  const carousel = document.getElementById("modal-messages-carousel");
  const prevBtn = document.getElementById("prev-message-btn");
  const nextBtn = document.getElementById("next-message-btn");
  carousel.innerHTML = "";
  currentMessageIndex = 0;
  if (messages.length === 0) {
    messagesBtn.classList.add("hidden");
    return;
  }
  messagesBtn.classList.remove("hidden");
  messages.forEach((msg) => {
    const card = document.createElement("div");
    card.className = "modal-message-card";
    card.textContent = msg;
    carousel.appendChild(card);
  });
  const showMessage = (index) => {
    carousel.scrollLeft = index * carousel.offsetWidth;
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
  showMessage(0);
}

// Función para mostrar notificaciones (sin cambios)
function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  const existingLoadingToast = document.querySelector(".toast.loading");
  if (existingLoadingToast) {
    existingLoadingToast.remove();
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  if (type !== "loading") {
    setTimeout(() => {
      toast.remove();
    }, duration);
  }
}
