document.addEventListener("DOMContentLoaded", () => {
  // Dynamically find the correct path for _feedback.html from the root
  const feedbackScript = document.querySelector(
    'script[src*="js/feedback.js"]'
  );
  if (!feedbackScript) {
    console.error(
      "Could not find feedback.js script tag. Cannot load component."
    );
    return;
  }
  const feedbackHtmlUrl = new URL("../_feedback.html", feedbackScript.src);

  // Dynamically load feedback component HTML
  fetch(feedbackHtmlUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Network response was not ok for _feedback.html. Status: ${response.status}`
        );
      }
      return response.text();
    })
    .then((data) => {
      document.body.insertAdjacentHTML("beforeend", data);

      // Now that the HTML is loaded, attach event listeners AND fix internal asset paths
      const feedbackComponent =
        document.getElementById("feedback-fab").parentElement; // Or a more specific wrapper
      const image = feedbackComponent.querySelector('img[src*="assets/"]');

      if (image) {
        const originalSrc = image.getAttribute("src");
        const absoluteUrl = new URL(originalSrc, feedbackHtmlUrl.href);
        image.src = absoluteUrl.href;
      }

      const openBtn = document.getElementById("open-feedback-btn");
      const closeBtn = document.getElementById("close-feedback-btn");
      const modal = document.getElementById("feedback-modal");
      const modalContent = modal ? modal.querySelector("div.bg-white") : null;

      if (openBtn && modal && modalContent) {
        openBtn.addEventListener("click", () => {
          modal.classList.remove("hidden");
          setTimeout(() => {
            modal.classList.remove("opacity-0", "scale-95");
            modal.classList.add("opacity-100", "scale-100");
          }, 10);
        });

        const closeModal = () => {
          modal.classList.add("opacity-0", "scale-95");
          setTimeout(() => {
            modal.classList.add("hidden");
          }, 200);
        };

        closeBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });
      }

      // Manually trigger translation for the newly added content
      if (window.i18n) {
        window.i18n.applyTranslations(window.i18n.translations);
      }
    })
    .catch((error) =>
      console.error("Error loading feedback component:", error)
    );
});
