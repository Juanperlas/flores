// public/js/editor.js

import { db, storage } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- Referencias a elementos del DOM ---
  const iframe = document.getElementById("preview-iframe");
  const acquireBtn = document.getElementById("acquire-btn");
  const previewBtn = document.getElementById("preview-btn");
  const messagesContainer = document.getElementById(
    "messages-inputs-container"
  );
  const addMessageBtn = document.getElementById("add-message-btn");
  const imagesContainer = document.getElementById("image-inputs-container");
  const addImageBtn = document.getElementById("add-image-btn");

  // --- Variables de Estado ---
  let iframeWindow;
  let selectedFiles = [];
  let currentPreviewSection = "intro"; // <-- LÓGICA RESTAURADA

  // --- Lógica de Previsualización en Vivo (CORREGIDA) ---
  function updatePreview() {
    if (!iframeWindow || !iframeWindow.updateViewer) return;
    const data = {
      view: currentPreviewSection, // <-- LÓGICA RESTAURADA
      intro: {
        mainMessage: document.getElementById("intro-message-input").value,
        senderName: document.getElementById("sender-name-input").value,
        receiverName: document.getElementById("receiver-name-input").value,
        secondaryMessage: document.getElementById("secondary-message-input")
          .value,
      },
      body: {
        title: document.getElementById("body-title-input").value,
        theme: document.querySelector('input[name="theme"]:checked').value,
        images: selectedFiles.map(URL.createObjectURL),
        messages: getMessages(),
        fallingElement: getFallingElement(),
      },
    };
    iframeWindow.updateViewer(data);
  }

  const setupIframeCommunication = () => {
    iframeWindow = iframe.contentWindow;

    // LÓGICA RESTAURADA para detectar el foco y cambiar la vista
    document.querySelectorAll("[data-preview-section]").forEach((element) => {
      element.addEventListener("focus", (event) => {
        const section = event.target.dataset.previewSection;
        if (section && section !== currentPreviewSection) {
          currentPreviewSection = section;
          updatePreview();
        }
      });
    });

    document.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("input", updatePreview);
    });
    document
      .querySelectorAll(".theme-selector, .element-selector")
      .forEach((el) => {
        el.addEventListener("change", updatePreview);
      });
    updatePreview();
  };

  if (
    iframe.contentWindow &&
    iframe.contentWindow.document.readyState === "complete"
  ) {
    setupIframeCommunication();
  } else {
    iframe.addEventListener("load", setupIframeCommunication);
  }

  // --- Lógica de Inputs Dinámicos (Mensajes e Imágenes) ---
  function getMessages() {
    return Array.from(messagesContainer.querySelectorAll("textarea"))
      .map((t) => t.value.trim())
      .filter(Boolean);
  }

  function getFallingElement() {
    const sel = document.querySelector(
      'input[name="falling-element"]:checked'
    ).value;
    return sel === "custom"
      ? document.getElementById("custom-element-input").value || "💖"
      : sel;
  }

  addMessageBtn.addEventListener("click", () => {
    if (messagesContainer.children.length >= 5) return;
    const group = document.createElement("div");
    group.className = "message-input-group";
    const textarea = document.createElement("textarea");
    textarea.rows = 2;
    textarea.addEventListener("input", updatePreview);
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "X";
    removeBtn.onclick = () => {
      group.remove();
      updatePreview();
    };
    group.append(textarea, removeBtn);
    messagesContainer.append(group);
  });

  addImageBtn.addEventListener("click", () => {
    if (selectedFiles.length >= 5) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = () => {
      if (input.files[0]) {
        selectedFiles.push(input.files[0]);
        renderImagePreviews();
        updatePreview();
      }
    };
    input.click();
  });

  function renderImagePreviews() {
    imagesContainer.innerHTML = "";
    selectedFiles.forEach((file, index) => {
      const group = document.createElement("div");
      group.className = "image-input-group";
      const imgPreview = document.createElement("img");
      imgPreview.className = "image-preview";
      imgPreview.src = URL.createObjectURL(file);
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-danger";
      removeBtn.textContent = "X";
      removeBtn.onclick = () => {
        selectedFiles.splice(index, 1);
        renderImagePreviews();
        updatePreview();
      };
      group.append(imgPreview, removeBtn);
      imagesContainer.append(group);
    });
  }

  document.getElementById("load-music-btn").onclick = () => {
    if (iframeWindow && iframeWindow.triggerMusicLoad) {
      iframeWindow.triggerMusicLoad(
        document.getElementById("music-url-input").value
      );
    }
  };

  // --- LÓGICA DEL BOTÓN "PREVISUALIZAR" ---
  previewBtn.addEventListener("click", () => {
    const creationData = {
      intro: {
        mainMessage: document.getElementById("intro-message-input").value,
        senderName: document.getElementById("sender-name-input").value,
        receiverName: document.getElementById("receiver-name-input").value,
        secondaryMessage: document.getElementById("secondary-message-input")
          .value,
      },
      body: {
        title: document.getElementById("body-title-input").value,
        theme: document.querySelector('input[name="theme"]:checked').value,
        musicUrl: document.getElementById("music-url-input").value,
        messages: getMessages(),
        fallingElement: getFallingElement(),
      },
    };
    localStorage.setItem("creationData", JSON.stringify(creationData));
    window.selectedFiles = selectedFiles;
    window.open("preview.html", "_blank");
  });

  // ===============================================================
  // LÓGICA DEL MODAL Y SUBIDA (BOTÓN "ADQUIRIR")
  // ===============================================================

  const shareModal = document.getElementById("share-modal");
  const closeShareModalBtn = shareModal.querySelector(".close-button");
  const showCodeInputBtn = document.getElementById("show-code-input-btn");
  const backToPaymentBtn = document.getElementById("back-to-payment-btn");
  const paymentView = document.getElementById("payment-view");
  const codeInputView = document.getElementById("code-input-view");
  const verifyCodeBtn = document.getElementById("verify-code-btn");

  acquireBtn.addEventListener("click", () =>
    shareModal.classList.remove("hidden")
  );
  closeShareModalBtn.addEventListener("click", () =>
    shareModal.classList.add("hidden")
  );
  showCodeInputBtn.addEventListener("click", () => {
    paymentView.classList.add("hidden");
    codeInputView.classList.remove("hidden");
  });
  backToPaymentBtn.addEventListener("click", () => {
    codeInputView.classList.add("hidden");
    paymentView.classList.remove("hidden");
  });
  verifyCodeBtn.addEventListener("click", verifyAndProcessPurchase);

  async function verifyAndProcessPurchase() {
    const codeInput = document.getElementById("purchase-code-input");
    const statusMessage = document.getElementById("code-status-message");
    const codeToVerify = codeInput.value.trim().toUpperCase();

    if (!codeToVerify) {
      statusMessage.textContent = "Por favor, ingresa un código.";
      statusMessage.className = "code-status error";
      return;
    }
    verifyCodeBtn.disabled = true;
    verifyCodeBtn.textContent = "Verificando...";
    statusMessage.textContent = "";

    try {
      const q = query(
        collection(db, "codes"),
        where("code", "==", codeToVerify)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("El código no existe. Por favor, revísalo.");
      }
      const codeDoc = querySnapshot.docs[0];
      if (codeDoc.data().isUsed) {
        throw new Error("Este código ya ha sido utilizado.");
      }
      statusMessage.textContent = "¡Código válido! Subiendo tu creación...";
      statusMessage.className = "code-status success";

      const newCreationId = await uploadCreationToFirebase(codeToVerify);
      const batch = writeBatch(db);
      const codeRef = doc(db, "codes", codeDoc.id);
      batch.update(codeRef, { isUsed: true, creationId: newCreationId });
      await batch.commit();
      displayFinalLink(newCreationId);
    } catch (error) {
      statusMessage.textContent = error.message || "Ocurrió un error.";
      statusMessage.className = "code-status error";
    } finally {
      verifyCodeBtn.disabled = false;
      verifyCodeBtn.textContent = "Verificar";
    }
  }

  async function uploadCreationToFirebase(purchaseCode) {
    // <-- Acepta el código como parámetro
    const imageUrls = await uploadImages(selectedFiles);
    const finalCreationData = {
      intro: {
        mainMessage: document.getElementById("intro-message-input").value,
        senderName: document.getElementById("sender-name-input").value,
        receiverName: document.getElementById("receiver-name-input").value,
        secondaryMessage: document.getElementById("secondary-message-input")
          .value,
      },
      body: {
        title: document.getElementById("body-title-input").value,
        theme: document.querySelector('input[name="theme"]:checked').value,
        images: imageUrls,
        messages: getMessages(),
        fallingElement: getFallingElement(),
        musicUrl: document.getElementById("music-url-input").value,
      },
      createdAt: new Date(),
      usedPurchaseCode: purchaseCode,
    };
    const docRef = await addDoc(collection(db, "creations"), finalCreationData);
    return docRef.id;
  }

  async function uploadImages(files) {
    const uploadPromises = files.map(async (file) => {
      const filePath = `creations/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploadPromises);
  }

  function displayFinalLink(creationId) {
    const finalUrl = `${window.location.origin}/flores.html?id=${creationId}`;
    const finalLinkView = document.getElementById("final-link-view");
    document.getElementById("final-url-input").value = finalUrl;
    const qrContainer = document.getElementById("qr-code-container");
    qrContainer.innerHTML = "";
    const qrImg = document.createElement("img");
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      finalUrl
    )}`;
    qrContainer.appendChild(qrImg);
    codeInputView.classList.add("hidden");
    paymentView.classList.add("hidden");
    finalLinkView.classList.remove("hidden");
  }
});
