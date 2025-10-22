// ================================
// CART MANAGEMENT
// ================================

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
  alert("✅ Item added to cart");
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.quantity, 0);
  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = total;
}

function displayCartItems() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const cart = getCart();
  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    const totalEl = document.getElementById("total-price");
    if (totalEl) totalEl.textContent = "0.00";
    return;
  }

  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.price} Rs x ${item.quantity}</p>
      <button onclick="removeItem(${item.id})">Remove</button>
    `;
    container.appendChild(div);
  });

  const totalEl = document.getElementById("total-price");
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

function removeItem(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  displayCartItems();
  alert("🗑️ Item removed");
}

function clearCart() {
  localStorage.removeItem("cart");
  updateCartCount();
  displayCartItems();
}

function goToCheckout() {
  window.location.href = "/checkout.html";
}

// ================================
// CHECKOUT + API COMMUNICATION
// ================================

async function submitCheckout(e) {
  e?.preventDefault();

  const cart = getCart();
  if (!cart.length) return alert("Your cart is empty!");

  const customer = {
    FirstName: document.getElementById("FirstName").value.trim(),
    LastName: document.getElementById("LastName").value.trim(),
    MobileNumber: document.getElementById("MobileNumber").value.trim(),
    PinCode: document.getElementById("PinCode").value.trim(),
    Address: document.getElementById("Address").value.trim(),
    EmailId: document.getElementById("EmailId").value.trim(),
  };

  if (!customer.FirstName || !customer.MobileNumber || !customer.Address) {
    return alert("Please fill in all required fields.");
  }

  try {
    // 🔹 STEP 1: Save Customer
    const res1 = await fetch("/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });

    if (!res1.ok) {
      const text = await res1.text();
      throw new Error(`Customer API Error: ${text}`);
    }

    const data1 = await res1.json();
    if (data1.status !== "success") throw new Error(data1.message || "Failed to save customer");

    // 🔹 STEP 2: Place Order
    const res2 = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: data1.customer_id, cart }),
    });

    if (!res2.ok) {
      const text = await res2.text();
      throw new Error(`Order API Error: ${text}`);
    }

    const data2 = await res2.json();
    if (data2.status !== "success") throw new Error(data2.message || "Failed to place order");

    // ✅ Success: clear and redirect
    clearCart();
    alert(`🎉 Order placed successfully! Order ID: ${data2.order_id}`);
    window.location.href = "/home.html";
  } catch (err) {
    console.error("Checkout Error:", err);
    alert("⚠️ Error placing order: " + err.message);
  }
}

// ================================
// LOGIN / REGISTER (localStorage)
// ================================

function login() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();
  const savedUsername = localStorage.getItem("username");
  const savedPassword = localStorage.getItem("password");
  const messageEl = document.getElementById("message");

  if (username === savedUsername && password === savedPassword) {
    messageEl.style.color = "green";
    messageEl.textContent = "Login successful!";
    window.location.href = "/home.html";
  } else {
    messageEl.style.color = "red";
    messageEl.textContent = "Invalid username or password.";
  }
}

function register() {
  const username = prompt("Enter username:");
  const password = prompt("Enter password:");
  if (username && password) {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    const msg = document.getElementById("message");
    msg.style.color = "green";
    msg.textContent = "Registration successful! You can now login.";
  }
}

// ================================
// INIT
// ================================

window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  displayCartItems();
});
