// blog.js — renders the blog listing page

function renderBlogPostsList() {
  const container = document.getElementById("blog-posts-list");
  if (!container) return;

  const posts = getAllBlogPosts();
  container.innerHTML = "";

  posts.forEach(post => {
    const isSwedish = getCurrentLanguage() === "sv";
    const title = isSwedish ? post.title : post.titleEn;
    const excerpt = isSwedish ? post.excerpt : post.excerptEn;
    const dateStr = isSwedish ? post.dateFormatted : formatDateEnglish(post.date);

    const postEl = document.createElement("article");
    postEl.classList.add("blog-post-preview");
    postEl.innerHTML = `
      <div class="blog-post-preview-header">
        <img src="${post.image}" alt="${title}" class="blog-post-preview-image" />
        <div class="blog-post-preview-content">
          <a href="blog-post.html?post=${post.id}" class="blog-post-preview-title">
            ${title}
          </a>
          <div class="blog-post-preview-meta">
            <span class="post-date">${dateStr}</span>
            <span class="post-separator">•</span>
            <span class="post-author">${post.author}</span>
          </div>
          <p class="blog-post-preview-excerpt">${excerpt}</p>
          <a href="blog-post.html?post=${post.id}" class="blog-post-preview-read-more">
            ${t("blog_read_more")} →
          </a>
        </div>
      </div>
    `;
    container.appendChild(postEl);
  });
}

// Helper function to format date in English
function formatDateEnglish(dateStr) {
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Get current language (fallback to Swedish if not available)
function getCurrentLanguage() {
  return localStorage.getItem("language") || "sv";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  // Setup header and modals first
  await setup();
  setupScrollWatcher();
  // Then render blog content
  renderBlogPostsList();
});
