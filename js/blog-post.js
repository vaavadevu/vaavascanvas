// blog-post.js — renders individual blog posts

function renderBlogPost() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post");

  if (!postId) {
    window.location.href = "blog.html";
    return;
  }

  const post = getBlogPostById(postId);
  if (!post) {
    window.location.href = "blog.html";
    return;
  }

  const isSwedish = getCurrentLanguage() === "sv";
  const title = isSwedish ? post.title : post.titleEn;
  const content = isSwedish ? post.content : post.contentEn;
  const dateStr = isSwedish ? post.dateFormatted : formatDateEnglish(post.date);

  // Update page title and meta tags
  document.title = `${title} – Vaavascanvas`;
  document.getElementById("post-title").textContent = `${title} – Vaavascanvas`;
  document.getElementById("post-meta-desc").content = post.excerpt;
  document.getElementById("post-canonical").href = `https://vaavascanvas.se/pages/blog-post.html?post=${post.id}`;
  
  document.getElementById("og-url").content = `https://vaavascanvas.se/pages/blog-post.html?post=${post.id}`;
  document.getElementById("og-title").content = title;
  document.getElementById("og-description").content = post.excerpt;
  document.getElementById("og-image").content = `https://vaavascanvas.se${post.image}`;

  // Render post content
  document.getElementById("post-heading").textContent = title;
  document.getElementById("post-date").textContent = dateStr;
  document.getElementById("post-author").textContent = post.author;
  document.getElementById("post-image").src = post.image;
  document.getElementById("post-image").alt = title;
  document.getElementById("post-content").innerHTML = content;

  // Render tags
  const tagsContainer = document.getElementById("post-tags");
  if (post.tags && post.tags.length > 0) {
    tagsContainer.innerHTML = post.tags.map(tag => 
      `<a href="blog.html?tag=${tag}" class="blog-tag">#${tag}</a>`
    ).join("");
  }

  // Render navigation
  const allPosts = getAllBlogPosts();
  const currentIndex = allPosts.findIndex(p => p.id === post.id);

  if (currentIndex > 0) {
    const prevPost = allPosts[currentIndex - 1];
    const prevTitle = isSwedish ? prevPost.title : prevPost.titleEn;
    const prevLink = document.getElementById("prev-post");
    prevLink.href = `blog-post.html?post=${prevPost.id}`;
    document.getElementById("prev-title").textContent = prevTitle;
    prevLink.style.display = "flex";
  }

  if (currentIndex < allPosts.length - 1) {
    const nextPost = allPosts[currentIndex + 1];
    const nextTitle = isSwedish ? nextPost.title : nextPost.titleEn;
    const nextLink = document.getElementById("next-post");
    nextLink.href = `blog-post.html?post=${nextPost.id}`;
    document.getElementById("next-title").textContent = nextTitle;
    nextLink.style.display = "flex";
  }
}

// Get current language
function getCurrentLanguage() {
  return localStorage.getItem("language") || "sv";
}

// Helper function to format date in English
function formatDateEnglish(dateStr) {
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  renderBlogPost();
  initializeLanguage();
});
