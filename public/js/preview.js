// public/js/preview.js

document.addEventListener("DOMContentLoaded", () => {
  // --- VARIABLES GLOBALES ---
  let player;
  let progressInterval;
  let firstImageUrl = "assets/default-image.png";

  // --- INICIALIZACIÓN ---
  const creationDataString = localStorage.getItem("creationData");
  const selectedFiles = window.opener ? window.opener.selectedFiles : [];

  if (!creationDataString) {
    document.body.innerHTML =
      "<h1>Error: No se encontraron datos para previsualizar.</h1>";
    return;
  }
  const creationData = JSON.parse(creationDataString);

  // Generar URLs temporales para las imágenes
  const imageUrls = selectedFiles.map((file) => {
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      console.error("Error al crear ObjectURL para el archivo:", file, e);
      return "assets/default-image.png";
    }
  });

  if (imageUrls.length > 0) {
    firstImageUrl = imageUrls[0];
  }

  // Poblar la página con los datos
  populatePreview(creationData, imageUrls);
  setupEventListeners();
  // CORRECCIÓN: Le pasamos la URL de la imagen directamente
  setupMusicDisc(firstImageUrl);

  // Cargar API de YouTube
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.musicUrl = creationData.body.musicUrl;

  // --- LÓGICA DEL BOTÓN "ADQUIRIR O EDITAR" ---
  const acquireBtn = document.getElementById("acquire-or-edit-btn");
  const closeMessageModal = document.getElementById("close-message-modal");
  const closePreviewNowBtn = document.getElementById("close-preview-now-btn");

  acquireBtn.addEventListener("click", () => {
    closeMessageModal.classList.remove("hidden");
  });

  closePreviewNowBtn.addEventListener("click", () => {
    window.close();
  });
});

// --- LÓGICA DE YOUTUBE ---
window.onYouTubeIframeAPIReady = function () {
  if (window.musicUrl) {
    triggerMusicLoad(window.musicUrl);
  }
};

function triggerMusicLoad(youtubeUrl) {
  const videoId = youtubeUrl.match(
    /(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|#|$)/
  )?.[1];
  if (!videoId) return;

  if (window.player) {
    window.player.destroy();
  }

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

function onPlayerStateChange(event) {
  updatePlayState(event.data);
}

// --- CONFIGURACIÓN DE EVENTOS GENERALES ---
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

// --- POBLAR Y RENDERIZAR VISTAS ---
function populatePreview(data, imageUrls) {
  document.getElementById("stage-body").className =
    "stage-body " + data.body.theme;
  document.getElementById("intro-main-message").innerText =
    data.intro.mainMessage;
  document.getElementById("sender-name").innerText = data.intro.senderName;
  document.getElementById("receiver-name").innerText = data.intro.receiverName;
  document.getElementById("intro-secondary-message").innerText =
    data.intro.secondaryMessage;
  document.getElementById("body-main-title").innerText = data.body.title;
  renderImageCarousel(imageUrls);
  renderModalMessages(data.body.messages);
  startFallingElements(data.body.fallingElement);
}

// --- FUNCIONES DEL REPRODUCTOR DE MÚSICA Y VISUALES ---
// CORRECCIÓN: La función ahora acepta un parámetro con la URL de la imagen
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
  // También actualizamos la imagen del disco grande en el modal
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
  const finalImages = images.length > 0 ? images : ["assets/default-image.png"];
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

// CORRECCIÓN: Lógica completa para el carrusel de mensajes
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

  // Ocultar botones si hay un solo mensaje
  if (messages.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
  } else {
    prevBtn.style.display = "block";
    nextBtn.style.display = "block";
  }

  showMessage(0);
}
