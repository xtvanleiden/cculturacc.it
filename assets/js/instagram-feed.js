(function () {
  var grid = document.getElementById("ig-grid");
  var status = document.getElementById("ig-status");
  if (!grid || !status) return;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(posts) {
    grid.innerHTML = posts
      .map(function (post) {
        var img = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
        var caption = post.caption ? post.caption.slice(0, 90) : "";
        return (
          '<a class="ig-post" href="' + post.permalink + '" target="_blank" rel="noopener noreferrer">' +
          '<img src="' + img + '" alt="" loading="lazy">' +
          (caption ? '<span class="ig-post-caption">' + escapeHtml(caption) + '</span>' : "") +
          "</a>"
        );
      })
      .join("");
  }

  fetch("/api/instagram")
    .then(function (res) {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then(function (data) {
      if (!data.posts || !data.posts.length) throw new Error("no posts");
      render(data.posts);
      status.style.display = "none";
    })
    .catch(function () {
      status.innerHTML =
        'Feed non disponibile al momento — vedi gli eventi direttamente su ' +
        '<a href="https://www.instagram.com/cculturacc/" target="_blank" rel="noopener noreferrer">instagram.com/cculturacc</a>.';
    });
})();
