/**
 * Checkout specific logic
 * Integrates with cartSystem, applies coupons, handles geolocation and WhatsApp flows.
 */

// Active promotional coupons
const ACTIVE_COUPONS = {
  "WELCOMETOCHAIWALE": { type: "flat_conditional", value: 20, min: 250, display: "40% OFF" },
  //"CHAI10": { type: "percent", value: 0.10, min: 0, display: "10% off your order" }, 
  //"WELCOME50": { type: "flat", value: 50, min: 0, display: "Flat ₹50 off" }    
};

// State variables
let currentDiscount = 0;
let distanceKms = 0;
let finalTotalAmount = 0;
let locationMapLink = "";
const STORE_LAT = 28.704285;
const STORE_LNG = 77.114757;

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  
  // Custom event listener if cart updates
  const originalSaveToStorage = cartSystem.saveToStorage;
  cartSystem.saveToStorage = function() {
    originalSaveToStorage.apply(this, arguments);
    renderCheckoutSummary();
  };

  // Coupons
  document.getElementById('applyCouponBtn')?.addEventListener('click', applyCoupon);
  document.getElementById('viewCouponsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const cList = document.getElementById('couponsListContainer');
    cList.innerHTML = '';
    const keys = Object.keys(ACTIVE_COUPONS);
    if (keys.length === 0) {
      cList.innerHTML = '<p>No coupons available</p>';
    } else {
      keys.forEach(k => {
        cList.innerHTML += `<div style="padding: 10px; border: 1px dashed #ccc; margin-bottom: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: var(--primary);">${k}</strong>
            <p style="margin: 5px 0 0; font-size: 0.9rem;">${ACTIVE_COUPONS[k].display}</p>
          </div>
          <button class="btn btn-outline" style="padding: 5px 15px; font-size: 0.85rem;" onclick="applyAutoCoupon('${k}')">Apply</button>
        </div>`;
      });
    }
    document.getElementById('couponsModal').style.display = 'flex';
  });

  // Address Geolocation
  document.getElementById('getLocationBtn')?.addEventListener('click', getUserLocation);

  // Place Order Flow
  document.getElementById('placeOrderBtn')?.addEventListener('click', handlePlaceOrderClick);
  
  // Payment Modals
  document.getElementById('payNowBtn')?.addEventListener('click', showQRModal);
  document.getElementById('payCodBtn')?.addEventListener('click', finalizeOrderAsCOD);
  
  // Step 1: QR Modal Buttons
  document.getElementById('confirmPaymentYes')?.addEventListener('click', handleStep1Yes);
  document.getElementById('confirmPaymentNo')?.addEventListener('click', () => {
    document.getElementById('qrModal').style.display = 'none';
    document.getElementById('payNowOrCodModal').style.display = 'flex';
  });

  // Step 1 Fallback Buttons
  document.getElementById('reopenPayNowBtn')?.addEventListener('click', () => {
    document.getElementById('payNowOrCodModal').style.display = 'none';
    showQRModal();
  });
  document.getElementById('chooseCodBtn')?.addEventListener('click', () => {
    document.getElementById('payNowOrCodModal').style.display = 'none';
    finalizeOrderAsCOD();
  });

  // Step 2: WA Confirm Modal Buttons
  document.getElementById('step2YesBtn')?.addEventListener('click', handleStep2Yes);
  document.getElementById('step2NoBtn')?.addEventListener('click', () => {
    document.getElementById('step2WaModal').style.display = 'none';
    document.getElementById('waShareModal').style.display = 'flex';
  });

  // WaShare Modal Buttons
  document.getElementById('shareWaBtn')?.addEventListener('click', shareWhatsAppScreenshot);
  document.getElementById('switchCodBtn')?.addEventListener('click', () => {
    document.getElementById('waShareModal').style.display = 'none';
    finalizeOrderAsCOD();
  });

  // Porter toggle tracking
  document.querySelectorAll('input[name="wantPorter"]').forEach(r => {
    r.addEventListener('change', (e) => {
      if (e.target.value === 'yes') {
        document.getElementById('porterBookerOptions').style.display = 'block';
        document.getElementById('porterNoOptions').style.display = 'none';
      } else {
        document.getElementById('porterBookerOptions').style.display = 'none';
        document.getElementById('porterNoOptions').style.display = 'block';
      }
    });
  });
});

function renderCheckoutSummary() {
  const container = document.getElementById('checkoutItemsContainer');
  const items = cartSystem.items;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 30px;">
        <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i>
        <p>Your basket is empty!</p>
        <a href="menu.html" class="btn btn-primary" style="margin-top: 15px;">Go to Menu</a>
      </div>
    `;
    document.getElementById('placeOrderBtn').disabled = true;
    updateTotals();
    return;
  }

  document.getElementById('placeOrderBtn').disabled = false;

  let html = `
    <div class="summary-item summary-item-header">
      <div>Item</div>
      <div>Price</div>
      <div>Qty</div>
      <div>Total</div>
      <div></div>
    </div>
  `;

  items.forEach(item => {
    const itemTotal = item.price * item.qty;
    html += `
      <div class="summary-item">
        <div data-label="Item" style="font-weight: 500;">${item.name}</div>
        <div data-label="Price">₹${item.price}</div>
        <div data-label="Qty" class="summary-qty-controls">
          <button class="qty-btn" onclick="cartSystem.updateQty('${item.id}', -1)" style="border:1px solid #ddd; width:28px; height:28px;">-</button>
          <span style="font-weight: 600; width: 20px; text-align: center;">${item.qty}</span>
          <button class="qty-btn" onclick="cartSystem.updateQty('${item.id}', 1)" style="border:1px solid #ddd; width:28px; height:28px;">+</button>
        </div>
        <div data-label="Total" style="font-weight: 600;">₹${itemTotal}</div>
        <div class="text-center">
          <button class="remove-btn" onclick="cartSystem.removeItem('${item.id}')" title="Remove Item"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  updateTotals();
}

function applyAutoCoupon(code) {
  document.getElementById('couponCode').value = code;
  applyCoupon();
  document.getElementById('couponsModal').style.display = 'none';
}

function applyCoupon() {
  const code = document.getElementById('couponCode').value.trim().toUpperCase();
  const msgEl = document.getElementById('couponMessage');
  
  if (!code) {
    currentDiscount = 0;
    msgEl.innerText = "";
    updateTotals();
    return;
  }

  cartSystem.loadFromStorage();
  const subtotal = cartSystem.getTotals();

  if (subtotal === 0) return;

  if (ACTIVE_COUPONS[code]) {
    const coupon = ACTIVE_COUPONS[code];
    
    // Check conditional limitations first
    if (coupon.min && subtotal < coupon.min) {
      currentDiscount = 0;
      msgEl.innerText = `Coupon valid on orders above ₹${coupon.min}`;
      msgEl.style.color = "#e74c3c";
      updateTotals();
      return;
    }

    if (coupon.type === "percent") {
      currentDiscount = subtotal * coupon.value;
    } else if (coupon.type === "flat" || coupon.type === "flat_conditional") {
      currentDiscount = coupon.value;
      if (currentDiscount > subtotal) currentDiscount = subtotal; 
    }
    
    msgEl.innerText = `Coupon ${code} applied successfully!`;
    msgEl.style.color = "var(--success)";
  } else {
    currentDiscount = 0;
    msgEl.innerText = "Invalid or expired promo code.";
    msgEl.style.color = "#e74c3c";
  }

  updateTotals();
}

function updateTotals() {
  const subtotal = cartSystem.getTotals();
  
  // Double check discount logic if quantity changed
  const code = document.getElementById('couponCode').value.trim().toUpperCase();
  if (ACTIVE_COUPONS[code]) {
      const coupon = ACTIVE_COUPONS[code];
      if (coupon.min && subtotal < coupon.min) {
        currentDiscount = 0;
      } else {
        if (coupon.type === "percent") currentDiscount = subtotal * coupon.value;
        else if (coupon.type === "flat" || coupon.type === "flat_conditional") currentDiscount = Math.min(coupon.value, subtotal);
      }
  } else {
      currentDiscount = 0;
  }

  finalTotalAmount = subtotal - currentDiscount;

  document.getElementById('summarySubtotal').innerText = `₹${subtotal}`;
  document.getElementById('summaryDiscount').innerText = `- ₹${currentDiscount.toFixed(2)}`;
  document.getElementById('summaryTotal').innerText = `₹${finalTotalAmount.toFixed(2)}`;
  
  // Adjust QR code modal total just in case UI refreshes during active QR view
  const qrTotalSpan = document.getElementById('qrTotalSpan');
  if (qrTotalSpan) qrTotalSpan.innerText = finalTotalAmount.toFixed(2);
}

// Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getUserLocation() {
  const msgEl = document.getElementById('locationMessage');
  const porterOpts = document.getElementById('porterOptions');
  
  if (!navigator.geolocation) {
    msgEl.innerText = "Geolocation is not supported by your browser.";
    return;
  }

  msgEl.innerText = "Locating...";
  msgEl.style.color = "var(--text-muted)";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      distanceKms = calculateDistance(STORE_LAT, STORE_LNG, latitude, longitude);
      locationMapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      msgEl.innerText = `You are approx ${distanceKms.toFixed(1)} km away.`;
      msgEl.style.color = "var(--success)";
      
      // Fill GPS field specifically
      const gpsField = document.getElementById('custGPS');
      if (gpsField) {
        gpsField.value = locationMapLink;
      }

      if (distanceKms > 2) {
        porterOpts.style.display = 'block';
      } else {
        porterOpts.style.display = 'none';
      }
    },
    (error) => {
      msgEl.innerText = "Unable to retrieve your location. Please type manually.";
      msgEl.style.color = "#e74c3c";
    }
  );
}

// -------------------
// PLACE ORDER LOGIC
// -------------------

function validateForm() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !phone || !address) {
    alert("Please fill in your Name, Phone, and Address.");
    return false;
  }
  if (cartSystem.items.length === 0) {
    alert("Your cart is empty!");
    return false;
  }
  if (document.getElementById('porterOptions').style.display === 'block') {
    const wantPorter = document.querySelector('input[name="wantPorter"]:checked').value;
    if (wantPorter === 'no') {
      alert("Delivery not available beyond 2km without Porter. Please modify your order or choose Porter.");
      return false;
    }
  }
  return true;
}

function handlePlaceOrderClick() {
  if (!validateForm()) return;
  document.getElementById('paymentMethodModal').style.display = 'flex';
}

function showQRModal() {
  document.getElementById('paymentMethodModal').style.display = 'none';
  document.getElementById('qrTotalSpan').innerText = finalTotalAmount.toFixed(2);
  document.getElementById('qrModal').style.display = 'flex';
}

function handleStep1Yes() {
  document.getElementById('qrModal').style.display = 'none';
  // Send the WhatsApp message first, DO NOT clear cart
  generateWhatsApp('Verification Pending', true, false);
  // Then immediately show Step 2 confirm modal
  document.getElementById('step2WaModal').style.display = 'flex';
}

function handleStep2Yes() {
  document.getElementById('step2WaModal').style.display = 'none';
  // Clear cart only when confirmed
  cartSystem.items = [];
  cartSystem.saveToStorage();
  document.getElementById('orderConfirmedModal').style.display = 'flex';
}

function finalizeOrderAsCOD() {
  document.getElementById('paymentMethodModal').style.display = 'none';
  generateWhatsApp('COD', false, true);
  document.getElementById('orderConfirmedModal').style.display = 'flex';
}

function shareWhatsAppScreenshot() {
  document.getElementById('waShareModal').style.display = 'none';
  generateWhatsApp('Verification Pending', true, false);
  // Return to check if shared
  document.getElementById('step2WaModal').style.display = 'flex';
}

// Generates the order text and opens WhatsApp
function generateWhatsApp(paymentStatus, prependPaymentText = false, clearCart = true) {
  const address = document.getElementById('custAddress').value.trim();
  const gpsLink = document.getElementById('custGPS') ? document.getElementById('custGPS').value.trim() : locationMapLink;
  
  let msg = ``;
  
  if (prependPaymentText) {
    msg += `Hi, I have paid online. Sharing screenshot.\n\n`;
  }

  msg += `Order Details:\n`;
  cartSystem.items.forEach(item => {
    msg += `Items: ${item.name} x ${item.qty}\n`;
  });
  
  if (currentDiscount > 0) {
    msg += `Total: ₹${finalTotalAmount.toFixed(2)} (Discounted)\n\n`;
  } else {
    msg += `Total: ₹${finalTotalAmount.toFixed(2)}\n\n`;
  }

  msg += `Address: ${address}\n`;
  if (gpsLink) {
    msg += `Location: ${gpsLink}\n\n`;
  } else if (locationMapLink) {
    msg += `Location: ${locationMapLink}\n\n`;
  } else {
    msg += `\n`;
  }
  
  if (document.getElementById('porterOptions').style.display === 'block') {
    const booker = document.querySelector('input[name="porterBooker"]:checked').value;
    if (booker === 'user') {
      msg += `Delivery Info: User will book Porter.\n\n`;
    } else {
      msg += `Delivery Info: Restaurant to book Porter (Charges apply).\n\n`;
    }
  }

  msg += `Payment: ${paymentStatus}`;

  const WA_NUMBER = "919310110414"; 
  const waUrl = `https://api.whatsapp.com/send?phone=${WA_NUMBER}&text=${encodeURIComponent(msg)}`;
  
  if (clearCart) {
    cartSystem.items = [];
    cartSystem.saveToStorage();
  }
  
  window.open(waUrl, '_blank');
}
