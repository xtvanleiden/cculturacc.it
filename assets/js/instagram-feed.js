(function () {
  var grid = document.getElementById("ig-grid");
  var status = document.getElementById("ig-status");
  var carousel = document.querySelector(".ig-carousel");
  var viewport = document.getElementById("ig-viewport");
  var prevBtn = document.getElementById("ig-prev");
  var nextBtn = document.getElementById("ig-next");
  if (!grid || !status) return;

  var postsData = [];
  var slides = [];
  var slideIndex = 0;
  var lastFocused = null;

  var modalOverlay, modalImg, modalCaption, modalVideoNote, modalLink,
    modalClose, modalPrevSlide, modalNextSlide, modalDots;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(posts) {
    postsData = posts;
    grid.innerHTML = posts
      .map(function (post, i) {
        var img = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
        var caption = post.caption ? post.caption.slice(0, 90) : "";
        var label = post.caption ? post.caption.slice(0, 60) : "post Instagram";
        return (
          '<button class="ig-post" type="button" data-index="' + i + '" aria-label="' +
          escapeHtml("Apri post: " + label) + '">' +
          '<img src="' + img + '" alt="" loading="lazy">' +
          (caption ? '<span class="ig-post-caption">' + escapeHtml(caption) + '</span>' : "") +
          "</button>"
        );
      })
      .join("");
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".ig-post") : null;
    if (!btn) return;
    openModal(Number(btn.getAttribute("data-index")));
  });

  // --- carosello (scroll nativo: swipe touch incluso) ---

  function updateArrows() {
    if (!viewport || !prevBtn || !nextBtn) return;
    var maxScroll = viewport.scrollWidth - viewport.clientWidth;
    prevBtn.disabled = viewport.scrollLeft <= 1;
    nextBtn.disabled = viewport.scrollLeft >= maxScroll - 1;
  }

  if (viewport && prevBtn && nextBtn) {
    prevBtn.addEventListener("click", function () {
      viewport.scrollBy({ left: -viewport.clientWidth, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      viewport.scrollBy({ left: viewport.clientWidth, behavior: "smooth" });
    });
    viewport.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
  }

  // --- modal ---

  function buildModal() {
    modalOverlay = document.createElement("div");
    modalOverlay.className = "ig-modal-overlay";
    modalOverlay.hidden = true;
    modalOverlay.innerHTML =
      '<div class="ig-modal" role="dialog" aria-modal="true" aria-label="Post Instagram">' +
        '<button class="ig-modal-close" type="button" aria-label="Chiudi">&times;</button>' +
        '<div class="ig-modal-media">' +
          '<button class="ig-modal-slide-arrow ig-modal-slide-prev" type="button" aria-label="Immagine precedente" hidden>&lsaquo;</button>' +
          '<img class="ig-modal-img" src="" alt="">' +
          '<button class="ig-modal-slide-arrow ig-modal-slide-next" type="button" aria-label="Immagine successiva" hidden>&rsaquo;</button>' +
        '</div>' +
        '<div class="ig-modal-dots"></div>' +
        '<div class="ig-modal-body">' +
          '<p class="ig-modal-caption"></p>' +
          '<p class="ig-modal-video-note" hidden>Guarda il video su Instagram</p>' +
          '<a class="ig-modal-link" href="#" target="_blank" rel="noopener noreferrer">Vedi su Instagram &rarr;</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalOverlay);

    modalImg = modalOverlay.querySelector(".ig-modal-img");
    modalCaption = modalOverlay.querySelector(".ig-modal-caption");
    modalVideoNote = modalOverlay.querySelector(".ig-modal-video-note");
    modalLink = modalOverlay.querySelector(".ig-modal-link");
    modalClose = modalOverlay.querySelector(".ig-modal-close");
    modalPrevSlide = modalOverlay.querySelector(".ig-modal-slide-prev");
    modalNextSlide = modalOverlay.querySelector(".ig-modal-slide-next");
    modalDots = modalOverlay.querySelector(".ig-modal-dots");

    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    modalClose.addEventListener("click", closeModal);
    modalPrevSlide.addEventListener("click", function () { showSlide(slideIndex - 1); });
    modalNextSlide.addEventListener("click", function () { showSlide(slideIndex + 1); });
    modalOverlay.addEventListener("keydown", handleModalKeydown);
  }

  function showSlide(i) {
    if (i < 0 || i >= slides.length) return;
    slideIndex = i;
    var slide = slides[slideIndex];
    modalImg.src = slide.media_type === "VIDEO" ? slide.thumbnail_url : slide.media_url;
    modalPrevSlide.disabled = slideIndex === 0;
    modalNextSlide.disabled = slideIndex === slides.length - 1;
    var dots = modalDots.querySelectorAll("span");
    for (var d = 0; d < dots.length; d++) {
      dots[d].className = d === slideIndex ? "is-active" : "";
    }
  }

  function openModal(index) {
    var post = postsData[index];
    if (!post) return;
    if (!modalOverlay) buildModal();

    var children = post.children && post.children.data ? post.children.data : [];
    slides = children.length
      ? children
      : [{ media_url: post.media_url, media_type: post.media_type, thumbnail_url: post.thumbnail_url }];

    var multi = slides.length > 1;
    modalPrevSlide.hidden = !multi;
    modalNextSlide.hidden = !multi;
    modalDots.innerHTML = multi
      ? slides.map(function () { return "<span></span>"; }).join("")
      : "";

    modalCaption.textContent = post.caption || "";
    modalCaption.hidden = !post.caption;
    modalVideoNote.hidden = post.media_type !== "VIDEO";
    modalLink.href = post.permalink;

    showSlide(0);

    lastFocused = document.activeElement;
    modalOverlay.hidden = false;
    document.body.classList.add("ig-modal-open");
    modalClose.focus();
    document.addEventListener("keydown", handleEscKey);
  }

  function closeModal() {
    if (!modalOverlay || modalOverlay.hidden) return;
    modalOverlay.hidden = true;
    document.body.classList.remove("ig-modal-open");
    document.removeEventListener("keydown", handleEscKey);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function handleEscKey(e) {
    if (e.key === "Escape") closeModal();
  }

  function handleModalKeydown(e) {
    if (e.key !== "Tab") return;
    var focusable = modalOverlay.querySelectorAll(
      "button:not([hidden]):not([disabled]), a[href]"
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // --- caricamento feed ---

  fetch("/api/instagram")
    .then(function (res) {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then(function (data) {
      if (!data.posts || !data.posts.length) throw new Error("no posts");
      render(data.posts);
      status.style.display = "none";
      updateArrows();
    })
    .catch(function () {
      if (carousel) carousel.style.display = "none";
      status.innerHTML =
        'Feed non disponibile al momento — vedi gli eventi direttamente su ' +
        '<a href="https://www.instagram.com/cculturacc/" target="_blank" rel="noopener noreferrer">instagram.com/cculturacc</a>.';
    });
})();
