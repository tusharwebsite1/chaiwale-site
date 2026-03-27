/**
 * Main application logic for the Homepage and global features
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Announcement Carousel Logic
  const announcementTrack = document.getElementById('announcementTrack');
  if (announcementTrack) {
    let currentSlide = 0;
    const slides = announcementTrack.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    
    if (totalSlides > 1) {
      setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        announcementTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
      }, 3000);
    }
  }

  // 2. Review Carousel Logic
  const reviewSlider = document.getElementById('reviewSlider');
  if (reviewSlider) {
    const slides = reviewSlider.querySelectorAll('.review-slide');
    const totalSlides = slides.length;
    let currentReview = 0;

    if (totalSlides > 1) {
      setInterval(() => {
        slides[currentReview].classList.remove('active');
        currentReview = (currentReview + 1) % totalSlides;
        slides[currentReview].classList.add('active');
      }, 4000);
    }
  }

  // 3. Homepage Grids (Fetch menu.json)
  const menuPreviewGrid = document.getElementById('menuPreviewGrid');
  const featuredContainer = document.getElementById('featuredContainer');
  const dealsContainer = document.getElementById('dealsContainer');
  
  if (menuPreviewGrid || featuredContainer || dealsContainer) {
    fetch('data/menu.json')
      .then(res => res.json())
      .then(data => {
        let allItems = [];
        Object.keys(data).forEach(cat => {
          data[cat].forEach(item => {
             item.category = cat;
             allItems.push(item);
          });
        });
        
        // Helper to get N random unique items
        function getRandomUniqueItems(arr, count, excludeSet = new Set()) {
          const validItems = arr.filter(i => !excludeSet.has(i.name));
          const shuffled = [...validItems].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, count);
        }

        const comboRules = {
          "Tea": ["Snacks", "Breakfast"],
          "Breakfast": ["Tea", "Shake/Drinks"],
          "Shake/Drinks": ["Sandwich", "Momos", "Snacks"],
          "Snacks": ["Tea", "Shake/Drinks"],
          "Lunch": ["Shake/Drinks", "Chinese"],
          "Maggie": ["Tea", "Shake/Drinks"],
          "Egg Items": ["Sandwich", "Tea"],
          "Sandwich": ["Shake/Drinks"],
          "Chinese": ["Shake/Drinks"],
          "Momos": ["Shake/Drinks"]
        };
        
        const validPairs = [];
        for(let i = 0; i < allItems.length; i++){
          for(let j = i+1; j < allItems.length; j++){
             let i1 = allItems[i], i2 = allItems[j];
             let c1 = i1.category, c2 = i2.category;
             if((comboRules[c1] && comboRules[c1].includes(c2)) || (comboRules[c2] && comboRules[c2].includes(c1))){
                 validPairs.push([i1, i2]);
             }
          }
        }
        
        const shuffledPairs = [...validPairs].sort(() => 0.5 - Math.random());
        const dealPairs = [];
        const usedForDeals = new Set();
        
        for (const pair of shuffledPairs) {
           if (dealPairs.length >= 2) break;
           if (!usedForDeals.has(pair[0].name) && !usedForDeals.has(pair[1].name)) {
               dealPairs.push(pair);
               usedForDeals.add(pair[0].name);
               usedForDeals.add(pair[1].name);
           }
        }

        // --- Render Deals of the Month ---
        if (dealsContainer) {
          if (dealPairs.length > 0) {
            dealsContainer.innerHTML = dealPairs.map((pair, idx) => {
              const i1 = pair[0];
              const i2 = pair[1];
              const basePrice = parseInt(i1.price) + parseInt(i2.price);
              
              const increase = basePrice * 1.20;
              const discount = increase * 0.90;
              
              const roundTo10 = (num) => Math.ceil(num / 10) * 10;
              
              const originalPrice = roundTo10(increase);
              let dealPrice = roundTo10(discount);
              if (dealPrice <= basePrice) dealPrice = roundTo10(basePrice + 1); // ensure no loss implicitly
              
              const comboName = `${i1.name} + ${i2.name}`;
              const comboDesc = `Includes: ${i1.name} and ${i2.name}.`;
              
              const dealItem = {
                id: `combo-${idx}`,
                name: comboName,
                price: dealPrice,
                description: comboDesc,
                image: i1.image || 'assets/images/default-combo.jpg',
                originalPrice: originalPrice
              };
              
              return generateDealCardHTML(dealItem);
            }).join('');
          } else {
            dealsContainer.innerHTML = '<p>No deals today.</p>';
          }
        }

        // --- Render Featured from Our Kitchen ---
        // 'featuredContainer' in index.html is no longer there, but if the code expects 'menuPreviewGrid' for Kitchen preview
        // it means we should render to 'menuPreviewGrid'. Wait, let's look at index.html: it has id="menuPreviewGrid".
        const menuPreviewGrid = document.getElementById('menuPreviewGrid');
        if (menuPreviewGrid) {
          const availableForFeatured = allItems.filter(i => !usedForDeals.has(i.name));
          // Pick 4 random
          const featuredItems = getRandomUniqueItems(availableForFeatured, 4);
          
          if (featuredItems.length > 0) {
            menuPreviewGrid.innerHTML = featuredItems.map(item => generateCardHTML(item)).join('');
          }
          if (typeof cartSystem !== 'undefined') cartSystem.updateItemButtons();
        }
      })
      .catch(err => {
        console.error('Failed to load dynamic data:', err);
      });
  }

  function generateCardHTML(item) {
    const imagePath = item.image ? item.image : '';
    const imgHtml = imagePath 
       ? `<img src="${imagePath}" alt="${item.name.replace(/"/g, '&quot;')}" class="menu-card-img" />`
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
    </div>`;
  }

  function generateDealCardHTML(item) {
    return `
    <div class="menu-card" style="border: 2px solid var(--accent);">
      <div class="menu-img-wrapper">
         <img src="${item.image}" alt="${item.name.replace(/"/g, '&quot;')}" class="menu-card-img" />
      </div>
      <div class="menu-card-content">
        <div class="menu-card-header">
          <h3 class="menu-title" style="font-size:1.1rem;">${item.name}</h3>
          <div class="menu-price">₹${item.price} <del style="font-size: 0.8rem; color: #888;">₹${item.originalPrice}</del></div>
        </div>
        <p class="menu-desc">${item.description}</p>
        <div class="cart-btn-container" data-item='{"id":"${(item.id || item.name).replace(/"/g, '\\"')}", "name":"${item.name.replace(/"/g, '\\"')}", "price":${item.price}}'></div>
      </div>
    </div>`;
  }

  // Navbar background change on scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      navbar.style.padding = '5px 0';
    } else {
      navbar.style.boxShadow = 'var(--shadow-sm)';
      navbar.style.padding = '0';
    }
  });

});

