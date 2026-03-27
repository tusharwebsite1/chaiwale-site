/**
 * Global Image Fallback System
 * Automatically attempts .jpg, .jpeg, .png, .webp formats before failing gracefully.
 * Keeps existing UI intact by applying classes directly.
 */
(function() {
  const ALREADY_FAILED_FLAG = 'data-fallback-exhausted';
  
  // Attach to capture phase to catch all image errors globally
  document.addEventListener('error', function(e) {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (img.hasAttribute(ALREADY_FAILED_FLAG)) return;

    let currentSrc = img.getAttribute('src');
    if (!currentSrc) {
       applyFallback(img);
       return;
    }
    
    // Ignore external URLs
    if (currentSrc.startsWith('http') && !currentSrc.includes(window.location.host)) {
       applyFallback(img);
       return;
    }

    if (!img.dataset.triedFormats) {
      const cleanSrc = currentSrc.split('?')[0];
      const lastDot = cleanSrc.lastIndexOf('.');
      
      // If no valid extension format, fallback immediately
      if (lastDot === -1 || lastDot < cleanSrc.lastIndexOf('/') || cleanSrc.startsWith('data:')) {
        applyFallback(img);
        return;
      }
      
      const ext = cleanSrc.substring(lastDot).toLowerCase();
      img.dataset.basePath = cleanSrc.substring(0, lastDot);
      img.dataset.triedFormats = JSON.stringify([ext]);
    }
    
    // Ordered Fallback Formats
    const formats = ['.jpg', '.jpeg', '.png', '.webp'];
    let tried = JSON.parse(img.dataset.triedFormats);
    
    const nextFormat = formats.find(f => !tried.includes(f));
    
    if (nextFormat) {
      tried.push(nextFormat);
      img.dataset.triedFormats = JSON.stringify(tried);
      
      // Attempt the next format
      img.src = img.dataset.basePath + nextFormat;
    } else {
      // All formats exhausted
      applyFallback(img);
    }
  }, true);

  function applyFallback(img) {
    img.setAttribute(ALREADY_FAILED_FLAG, 'true');
    img.style.display = 'none'; // Hide the broken image stub

    // 1. Menu Items Fallback
    if (img.parentElement && img.parentElement.classList.contains('menu-img-wrapper')) {
      img.parentElement.classList.add('no-image');
    }
    // 2. Logo Fallback (reveal adjacent span text)
    else if (img.classList.contains('logo-img')) {
      if (img.nextElementSibling && img.nextElementSibling.tagName === 'SPAN') {
        img.nextElementSibling.style.display = 'inline';
      }
    }
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img").forEach(img => {
    if (img.complete) img.classList.add("loaded");
    else img.onload = () => img.classList.add("loaded");
  });
});
