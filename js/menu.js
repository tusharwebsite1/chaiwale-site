/**
 * Menu Page Logic
 * Fetches JSON, generates the categories navigation, and renders items.
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('fullMenuContainer');
  const navContainer = document.getElementById('categoryNavContainer');

  if (!container || !navContainer) return;

  // Determine path offset, menu.json is at ../data/menu.json or data/menu.json depending on setup
  // Based on current file structure:
  // index.html is at root -> data/menu.json
  // pages/menu.html is at pages/ -> ../data/menu.json
  fetch('../data/menu.json')
    .then(res => res.json())
    .then(data => {
      // data is now { "Category 1": [...items], "Category 2": [...items] }
      const categoryNames = Object.keys(data);
      renderCategoryNav(categoryNames);
      renderCategories(data);
      setupScrollSpy();
    })
    .catch(err => {
      console.error("Failed to load full menu data", err);
      container.innerHTML = `<div class="text-center" style="padding: 50px; color: red;">Failed to load menu. Please refresh try again later.</div>`;
    });

  function renderCategoryNav(categories) {
    navContainer.innerHTML = categories.map((cat, idx) => {
      const idStr = cat.replace(/\s+/g, '-').toLowerCase();
      return `
      <a href="#cat-${idStr}" class="cat-pill ${idx === 0 ? 'active' : ''}" data-target="cat-${idStr}">
        ${cat}
      </a>
      `
    }).join('');
    
    // Smooth scrolling for category pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = pill.getAttribute('href').substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          // scroll with offset for the sticky nav + navbar (70px + 50px)
          const y = targetEl.getBoundingClientRect().top + window.scrollY - 130;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
  }

  function renderCategories(menuDict) {
    let html = '';
    
    Object.keys(menuDict).forEach(catName => {
      const idStr = catName.replace(/\s+/g, '-').toLowerCase();
      const items = menuDict[catName];
      
      html += `
        <div class="category-section" id="cat-${idStr}">
          <h2 class="category-title">${catName}</h2>
          <div class="menu-grid">
            ${items.map(item => {
              const imagePath = item.image ? item.image : '';
              const imgHtml = imagePath 
                 ? `<img src="${imagePath}" alt="${item.name}" class="menu-card-img" />`
                 : '';
              const noImgClass = imagePath ? '' : 'no-image';
              
              return `
              <div class="menu-card">
                <div class="menu-img-wrapper ${noImgClass}">
                  ${imgHtml}
                </div>
                <div class="menu-card-content">
                  <div class="menu-card-header">
                    <h3 class="menu-title">${item.name}</h3>
                    <div class="menu-price">₹${item.price}</div>
                  </div>
                  ${item.description ? `<p class="menu-desc">${item.description}</p>` : `<p class="menu-desc"></p>`}
                  <div class="cart-btn-container" data-item='{"id":"${(item.id || item.name).replace(/"/g, '\\"')}", "name":"${item.name.replace(/"/g, '\\"')}", "price":${item.price}}'></div>
                </div>
              </div>
            `}).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (typeof cartSystem !== 'undefined') cartSystem.updateItemButtons();
  }

  function setupScrollSpy() {
    window.addEventListener('scroll', () => {
      let currentSectionId = '';
      const sections = document.querySelectorAll('.category-section');
      
      sections.forEach(sec => {
        const top = sec.getBoundingClientRect().top;
        if (top <= 140) { // accounting for sticky headers
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        document.querySelectorAll('.cat-pill').forEach(pill => {
          pill.classList.remove('active');
          if (pill.getAttribute('data-target') === currentSectionId) {
            pill.classList.add('active');
            // scroll nav container to make pill visible
            navContainer.scrollTo({
              left: pill.offsetLeft - 20,
              behavior: 'smooth'
            });
          }
        });
      }
    });
  }
});

