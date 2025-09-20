document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const introMessageInput = document.getElementById("intro-message-input");
  const senderNameInput = document.getElementById("sender-name-input");
  const receiverNameInput = document.getElementById("receiver-name-input");
  const secondaryMessageInput = document.getElementById(
    "secondary-message-input"
  );
  const bodyTitleInput = document.getElementById("body-title-input");
  const themeSelector = document.querySelector(".theme-selector");
  const musicUrlInput = document.getElementById("music-url-input");
  const loadMusicBtn = document.getElementById("load-music-btn");
  const imagesContainer = document.getElementById("image-inputs-container");
  const addImageBtn = document.getElementById("add-image-btn");
  const messagesContainer = document.getElementById(
    "messages-inputs-container"
  );
  const addMessageBtn = document.getElementById("add-message-btn");
  const iframe = document.getElementById("preview-iframe");
  const shareCreationBtn = document.getElementById("share-creation-btn");
  const elementSelector = document.querySelector(".element-selector");

  let iframeWindow;
  let currentPreviewSection = "intro";

  // Función para obtener el elemento animado seleccionado
  function getFallingElement() {
    const selected = document.querySelector(
      'input[name="falling-element"]:checked'
    ).value;
    if (selected === "custom") {
      return document.getElementById("custom-element-input").value || "💖";
    }
    return selected;
  }

  function getImages() {
    const imagePreviews = imagesContainer.querySelectorAll(".image-preview");
    return Array.from(imagePreviews).map((img) => ({
      file: img.file,
      previewUrl: img.src,
    }));
  }
  function getMessages() {
    const messageTextareas = messagesContainer.querySelectorAll("textarea");
    return Array.from(messageTextareas)
      .map((textarea) => textarea.value.trim())
      .filter((msg) => msg !== "");
  }

  function updatePreview() {
    if (!iframeWindow || !iframeWindow.updateViewer) return;
    const data = {
      view: currentPreviewSection,
      intro: {
        mainMessage: introMessageInput.value,
        senderName: senderNameInput.value,
        receiverName: receiverNameInput.value,
        secondaryMessage: secondaryMessageInput.value,
      },
      body: {
        title: bodyTitleInput.value,
        theme: document.querySelector('input[name="theme"]:checked').value,
        images: getImages().map((img) => img.previewUrl),
        messages: getMessages(),
        fallingElement: getFallingElement(),
      },
    };
    // Llenamos los datos de intro para no repetir código
    data.intro.mainMessage = introMessageInput.value;
    data.intro.senderName = senderNameInput.value;
    data.intro.receiverName = receiverNameInput.value;
    data.intro.secondaryMessage = secondaryMessageInput.value;

    iframeWindow.updateViewer(data);
  }

  const setupIframeCommunication = () => {
    iframeWindow = iframe.contentWindow;
    document.querySelectorAll("[data-preview-section]").forEach((element) => {
      element.addEventListener("focus", (event) => {
        const section = event.target.dataset.previewSection;
        if (section && section !== currentPreviewSection) {
          currentPreviewSection = section;
          updatePreview();
        }
      });
    });
    document.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", updatePreview);
    });
    themeSelector.addEventListener("change", updatePreview);
    elementSelector.addEventListener("change", updatePreview);

    loadMusicBtn.addEventListener("click", () => {
      if (currentPreviewSection !== "body") {
        currentPreviewSection = "body";
        updatePreview();
      }
      if (iframeWindow && iframeWindow.triggerMusicLoad) {
        const originalIcon = loadMusicBtn.innerHTML;
        loadMusicBtn.innerHTML = "🔄";

        // El callback ahora recibe un parámetro 'success'
        iframeWindow.triggerMusicLoad(musicUrlInput.value, (success) => {
          loadMusicBtn.innerHTML = originalIcon;
          // Si no fue exitoso, limpiamos el input
          if (!success) {
            musicUrlInput.value = "";
          }
        });
      }
    });
    updatePreview();
  };
  if (iframe.contentWindow.document.readyState === "complete") {
    setupIframeCommunication();
  } else {
    iframe.addEventListener("load", setupIframeCommunication);
  }

  // Pego el código de las funciones de añadir inputs aquí para que no tengas que buscarlo
  function addMessageInput() {
    if (messagesContainer.children.length >= 5) return;
    const group = document.createElement("div");
    group.className = "message-input-group";
    const textarea = document.createElement("textarea");
    textarea.rows = 2;
    textarea.placeholder = `Mensaje #${messagesContainer.children.length + 1}`;
    textarea.addEventListener("input", updatePreview);
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "X";
    removeBtn.onclick = () => {
      group.remove();
      updatePreview();
    };
    group.appendChild(textarea);
    group.appendChild(removeBtn);
    messagesContainer.appendChild(group);
  }
  function addImageInput() {
    if (imagesContainer.children.length >= 5) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.addEventListener("change", () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const previewUrl = URL.createObjectURL(file);
        const group = document.createElement("div");
        group.className = "image-input-group";
        const imgPreview = document.createElement("img");
        imgPreview.className = "image-preview";
        imgPreview.src = previewUrl;
        imgPreview.file = file;
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-danger";
        removeBtn.textContent = "X";
        removeBtn.onclick = () => {
          group.remove();
          URL.revokeObjectURL(previewUrl);
          updatePreview();
        };
        group.appendChild(imgPreview);
        group.appendChild(removeBtn);
        imagesContainer.appendChild(group);
        updatePreview();
      }
    });
    input.click();
  }

  addMessageBtn.addEventListener("click", addMessageInput);
  addImageBtn.addEventListener("click", addImageInput);
  shareCreationBtn.addEventListener("click", () => {
    alert("¡Compartir Creación! Esta funcionalidad se implementará pronto.");
  });
});
