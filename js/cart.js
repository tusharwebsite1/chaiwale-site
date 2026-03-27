/**
 * Global Cart System
 * Handles localStorage state, UI drawer toggling, and WhatsApp checkout logic.
 */
const cartSystem = {
  items: [],
  cartKey: 'chaiwale_cart',

  init() {
    this.loadFromStorage();
    this.updateUI();
  },

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.cartKey);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Could not load cart from localStorage', e);
      this.items = [];
    }
  },

  saveToStorage() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.items));
  },

  toggleDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      drawer.classList.toggle('active');
      overlay.classList.toggle('active');
      
      // Attempt to sync UI if opened
      if (drawer.classList.contains('active')) {
        this.updateUI();
      }
    }
  },

  // addItem takes { id, name, price, qty }
  addItem(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      this.items.push({ ...item, qty: item.qty || 1 });
    }
    this.saveToStorage();
    this.updateUI();
    
    // Optional: add a quick animation to the cart button
    const toggleBtn = document.querySelector('.cart-toggle');
    if (toggleBtn) {
      toggleBtn.style.transform = 'scale(1.1)';
      setTimeout(() => toggleBtn.style.transform = 'translateY(-2px)', 200);
    }
  },

  updateQty(itemId, change) {
    const itemIndex = this.items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
      this.items[itemIndex].qty += change;
      if (this.items[itemIndex].qty <= 0) {
        this.items.splice(itemIndex, 1);
      }
      this.saveToStorage();
      this.updateUI();
    }
  },

  removeItem(itemId) {
    this.items = this.items.filter(i => i.id !== itemId);
    this.saveToStorage();
    this.updateUI();
  },

  getTotals() {
    return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  updateUI() {
    const badge = document.getElementById('cartBadgeCount');
    const container = document.getElementById('cartItemsContainer');
    const proceedBtn = document.getElementById('proceedBtn');
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    const checkoutForm = document.getElementById('checkoutForm');
    
    // Total Items
    const totalItems = this.items.reduce((sum, i) => sum + i.qty, 0);
    if (badge) badge.innerText = totalItems;

    // Render Items
    if (container) {
      if (this.items.length === 0) {
        container.innerHTML = `
          <div class="cart-empty">
            <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i>
            <p>Your basket is empty!<br>Add some delicious chai and snacks.</p>
          </div>
        `;
        if (proceedBtn) proceedBtn.style.display = 'none';
        if (checkoutForm) checkoutForm.style.display = 'none';
      } else {
        container.innerHTML = this.items.map(item => `
          <div class="cart-item">
            <div class="cart-item-info">
              <h4>${item.name}</h4>
              <div class="cart-item-price">₹${item.price}</div>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="cartSystem.updateQty('${item.id}', -1)">-</button>
              <span style="font-weight: 600; width: 20px; text-align: center;">${item.qty}</span>
              <button class="qty-btn" onclick="cartSystem.updateQty('${item.id}', 1)">+</button>
            </div>
          </div>
        `).join('');
        if (proceedBtn && (!checkoutForm || checkoutForm.style.display !== 'block')) {
          proceedBtn.style.display = 'block';
        }
      }
    }

    // Totals
    const totalAmount = this.getTotals();
    if (subtotalEl) subtotalEl.innerText = `₹${totalAmount}`;
    if (totalEl) totalEl.innerText = `₹${totalAmount}`;
    
    this.updateItemButtons();
  },

  updateItemButtons() {
    const containers = document.querySelectorAll('.cart-btn-container');
    containers.forEach(container => {
      try {
        const item = JSON.parse(container.dataset.item);
        const cartItem = this.items.find(i => i.id === item.id);
        
        if (cartItem) {
          container.innerHTML = `
            <div class="qty-controls" style="display:flex; justify-content:space-between; align-items:center; width:100%; height:42px; background:var(--bg-color); color:var(--primary); border-radius:var(--radius-sm); border:1px solid var(--primary); overflow:hidden; font-family: var(--font-body);">
              <button onclick="cartSystem.updateQty('${cartItem.id.replace(/'/g, "\\'")}', -1)" style="flex:1; height:100%; background:transparent; border:none; color:var(--primary); font-size:1.2rem; font-weight:bold; cursor:pointer; flex-basis: 33%;" aria-label="Decrease Quantity">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span style="flex:1; text-align:center; font-weight:800; font-size:1.1rem; flex-basis: 33%;">${cartItem.qty}</span>
              <button onclick="cartSystem.updateQty('${cartItem.id.replace(/'/g, "\\'")}', 1)" style="flex:1; height:100%; background:transparent; border:none; color:var(--primary); font-size:1.2rem; font-weight:bold; cursor:pointer; flex-basis: 33%;" aria-label="Increase Quantity">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          `;
        } else {
          container.innerHTML = `
            <button class="add-to-cart-btn" data-id="${item.id.replace(/"/g, '&quot;')}" data-name="${item.name.replace(/"/g, '&quot;')}" data-price="${item.price}" style="width: 100%; height: 42px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; border-radius: var(--radius-sm); background: var(--primary); color: white; transition: all 0.2s ease;">
              <i class="fa-solid fa-plus" style="margin-right: 5px;"></i> Add to Cart
            </button>
          `;
        }
      } catch(e) { 
        console.error("Error generating dynamic cart button UI", e); 
      }
    });
  },

  showCheckoutForm() {
    const btn = document.getElementById('proceedBtn');
    const form = document.getElementById('checkoutForm');
    if (btn) btn.style.display = 'none';
    if (form) form.style.display = 'block';
    
    // small scroll to form
    const drawerRow = document.querySelector('.cart-footer');
    if (drawerRow) drawerRow.scrollIntoView({ behavior: 'smooth' });
  },

  submitOrder() {
    // Validate
    const name = document.getElementById('custName')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const address = document.getElementById('custAddress')?.value.trim();
    const note = document.getElementById('custNote')?.value.trim() || 'None';

    if (!name || !phone || !address) {
       alert("Please fill in your Name, Phone, and Address to proceed.");
       return;
    }

    if (this.items.length === 0) {
       alert("Your cart is empty!");
       return;
    }

    // Generate WhatsApp Message
    let msg = `*New Order - Chaiwale* ☕\n\n`;
    msg += `*Customer Details:*\n`;
    msg += `👤 Name: ${name}\n`;
    msg += `📞 Phone: ${phone}\n`;
    msg += `📍 Address/Table: ${address}\n\n`;
    
    msg += `*Order Items:*\n`;
    let subtotal = 0;
    this.items.forEach((item, index) => {
      const lineTotal = item.price * item.qty;
      subtotal += lineTotal;
      msg += `${index + 1}. ${item.name} × ${item.qty} = ₹${lineTotal}\n`;
    });
    
    msg += `\n*Subtotal:* ₹${subtotal}\n`;
    msg += `*Total Amount:* ₹${subtotal}\n\n`;
    msg += `📝 *Note*: ${note}`;

    // Target WhatsApp Number
    const WA_NUMBER = "919310110414"; 
    
    // Redirect
    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=${WA_NUMBER}&text=${encodedMsg}`;
    
    window.open(waUrl, "_blank");

    // Clear cart optional (commented out so user doesn't lose data if WA fails to open)
    // this.items = [];
    // this.saveToStorage();
    // this.updateUI();
    // this.toggleDrawer();
    // document.getElementById('checkoutForm').style.display = 'none';
  },

  // --- Cart Exit Confirmation System ---
  showExitModal() {
    let modal = document.getElementById('cartExitModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'cartExitModal';
      modal.style.zIndex = '3500'; // above everything
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
          <h2 style="color: var(--primary); margin-bottom: 15px;"><i class="fa-solid fa-triangle-exclamation"></i> Hold On!</h2>
          <p style="margin-bottom: 20px; font-size: 1.05rem;">Do you want to remove items from your cart or explore more items?</p>
          
          <div id="exploreContainer" style="display:none; text-align:left; margin-bottom: 20px; background: var(--bg-color); padding: 15px; border-radius: 8px;">
            <h4 style="margin-bottom: 10px; color: var(--primary);"><i class="fa-solid fa-utensils"></i> You May Also Like:</h4>
            <div id="exploreItemsList" style="display:flex; flex-direction:column; gap:10px;"></div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-primary" id="exitModalGoMenuBtn" onclick="cartSystem.handleExplore()">Explore Menu</button>
            <button class="btn btn-outline" onclick="cartSystem.closeExitModal()">Continue with Cart</button>
            <button class="btn" style="background: #ffebee; border: 1px solid #ffcdd2; color: #dc3545;" onclick="cartSystem.clearAndExit()">Remove Items (Clear Cart)</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this.exploreClicks = 0;
    }
    
    // reset view on open
    document.getElementById('exploreContainer').style.display = 'none';
    document.getElementById('exitModalGoMenuBtn').innerHTML = "Explore Menu";
    document.getElementById('exitModalGoMenuBtn').onclick = () => this.handleExplore();
    this.exploreClicks = 0;
    
    modal.style.display = 'flex';
  },

  closeExitModal() {
    const modal = document.getElementById('cartExitModal');
    if (modal) modal.style.display = 'none';
    window.pendingExitUrl = null;
  },

  clearAndExit() {
    this.items = [];
    this.saveToStorage();
    this.updateUI();
    window.allowExit = true;
    
    const basePath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
    window.location.href = window.pendingExitUrl || basePath;
  },

  handleExplore() {
    this.exploreClicks = (this.exploreClicks || 0) + 1;
    
    if (this.exploreClicks >= 3) {
       document.getElementById('exitModalGoMenuBtn').innerHTML = "View Full Menu";
       document.getElementById('exitModalGoMenuBtn').onclick = () => {
           window.allowExit = true;
           window.location.href = window.location.pathname.includes('/pages/') ? 'menu.html' : 'pages/menu.html';
       };
    } else {
       const dataUrl = window.location.pathname.includes('/pages/') ? '../data/menu.json' : 'data/menu.json';
       fetch(dataUrl).then(res => res.json()).then(data => {
           let allItems = [];
           Object.values(data).forEach(arr => allItems = allItems.concat(arr));
           
           const cartIds = new Set(this.items.map(i => i.id));
           const pool = allItems.filter(i => !cartIds.has(i.id || i.name));
           
           const shuffled = pool.sort(() => 0.5 - Math.random());
           const selected = shuffled.slice(0, 3); // 3 random items
           
           const container = document.getElementById('exploreContainer');
           const list = document.getElementById('exploreItemsList');
           container.style.display = 'block';
           
           list.innerHTML = selected.map(i => `
             <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:10px; border-radius:6px; box-shadow:var(--shadow-sm);">
               <div style="flex:1;">
                 <div style="font-weight:600; font-size: 0.95rem;">${i.name}</div>
                 <div style="color:var(--primary); font-size:0.9rem; font-weight:600;">₹${i.price}</div>
               </div>
               <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="cartSystem.addItem({id:'${i.id||i.name}', name:'${i.name.replace(/'/g,"\\'")}', price:${i.price}, qty:1}); this.innerHTML='<i class=\\'fa-solid fa-check\\'></i>'; this.style.background='var(--success)'; this.style.color='white'; this.style.borderColor='var(--success)'; this.disabled=true;">Add</button>
             </div>
           `).join('');
       }).catch(e => console.error("Error loading explore items", e));
    }
  }
};

// Initialize early
document.addEventListener('DOMContentLoaded', () => {
  cartSystem.init();

  // Global Event Delegation for Add to Cart
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price'));
      
      if (id && name && !isNaN(price)) {
        cartSystem.addItem({ id, name, price, qty: 1 });
        
        // Visual feedback
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
        btn.classList.add('added');
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove('added');
        }, 1500);
      }
    }
  });

  // Global Navigation Interceptor (Cart Exit Protection)
  window.allowExit = false;

  document.addEventListener('click', (e) => {
    // Explicitly allow internal button navigations
    if (e.target.closest('#proceedBtn') || e.target.closest('.float-order')) {
      window.allowExit = true;
    }
    
    const link = e.target.closest('a');
    if (!link || !link.href) return;
    
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    
    try {
      const currentUrlObj = new URL(window.location.href);
      const linkUrlObj = new URL(link.href, window.location.origin);
      
      // Ignore internal anchor links
      if (linkUrlObj.pathname === currentUrlObj.pathname && linkUrlObj.hash) {
         return; 
      }
      
      // If it's an internal app navigation, allow it so cart doesn't incorrectly trigger beforeunload
      if (linkUrlObj.hostname === window.location.hostname) {
        window.allowExit = true;
      } else {
        // External navigation attempt, trap with cart exit modal
        if (cartSystem.items.length > 0 && !window.allowExit) {
          e.preventDefault();
          window.pendingExitUrl = link.href;
          cartSystem.showExitModal();
        }
      }
    } catch(err) {}
  });

  // Exit intent popup (Mouse leaves the top of the viewport)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && cartSystem.items.length > 0 && !window.allowExit) {
      if (document.getElementById('cartExitModal')?.style.display !== 'flex') {
         cartSystem.showExitModal();
      }
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (cartSystem.items.length > 0 && !window.allowExit) {
      e.preventDefault();
      e.returnValue = ''; // Trigger native browser exit confirmation
    }
  });
});
