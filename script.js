// SIMPLE SMARKLET APP (no frameworks) - localStorage based users/cart
(() => {
  // sample product list (id, title, price, desc, img)
  const products = [
    {id:1, title:"Sleek Sneakers", price:2499, desc:"Comfortable everyday sneakers with breathable mesh.", img:"https://via.placeholder.com/600x400/ff6f61/fff?text=Sneakers"},
    {id:2, title:"Wireless Headphones", price:3999, desc:"Noise-cancelling over-ear headphones with long battery life.", img:"https://via.placeholder.com/600x400/6a5acd/fff?text=Headphones"},
    {id:3, title:"Travel Backpack", price:1899, desc:"Waterproof backpack with laptop pocket and organizer.", img:"https://via.placeholder.com/600x400/fed700/111?text=Backpack"},
    {id:4, title:"Smart Watch", price:3199, desc:"Track fitness and notifications with a stylish watch.", img:"https://via.placeholder.com/600x400/00c49a/fff?text=Smart+Watch"},
    {id:5, title:"Classic Sunglasses", price:899, desc:"UV-protected sunglasses with durable frame.", img:"https://via.placeholder.com/600x400/ffb86b/111?text=Sunglasses"},
    {id:6, title:"Leather Wallet", price:799, desc:"Slim leather wallet with RFID protection.", img:"https://via.placeholder.com/600x400/8bd3dd/111?text=Wallet"},
    // include one product that uses the uploaded local image
    {id:7, title:"User Image Product", price:1299, desc:"A product that demonstrates your uploaded image.", img:"/mnt/data/aa1fd428-6fb5-4510-9744-0fcee2da906d.png"},
    // more demo products
    {id:8, title:"Bluetooth Speaker", price:1499, desc:"Portable speaker with rich bass and long playtime.", img:"https://via.placeholder.com/600x400/7acbf9/111?text=Speaker"},
    {id:9, title:"Yoga Mat", price:599, desc:"Non-slip yoga mat for comfortable workouts.", img:"https://via.placeholder.com/600x400/ffd6e0/111?text=Yoga+Mat"},
    {id:10, title:"Office Lamp", price:1299, desc:"LED desk lamp with adjustable brightness and color.", img:"https://via.placeholder.com/600x400/b7b7ff/111?text=Lamp"}
  ];

  // DOM refs
  const productsGrid = document.getElementById('productsGrid');
  const productModal = document.getElementById('productModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalPrice = document.getElementById('modalPrice');
  const modalQty = document.getElementById('modalQty');
  const addToCartBtn = document.getElementById('addToCart');
  const buyNowBtn = document.getElementById('buyNow');
  const closeProductModal = document.getElementById('closeProductModal');

  const cartToggle = document.getElementById('cartToggle');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartItemsDiv = document.getElementById('cartItems');
  const closeCart = document.getElementById('closeCart');
  const cartCount = document.getElementById('cartCount');
  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalAmountEl = document.getElementById('totalAmount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const signinBtn = document.getElementById('signinBtn');
  const signupBtn = document.getElementById('signupBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');

  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const showSignup = document.getElementById('showSignup');
  const showSignin = document.getElementById('showSignin');

  const searchInput = document.getElementById('search');
  const shopNow = document.getElementById('shopNow');

  let currentProduct = null;

  // storage helpers
  const storage = {
    getCart(){ return JSON.parse(localStorage.getItem('smarklet_cart')||'[]') },
    saveCart(c){ localStorage.setItem('smarklet_cart', JSON.stringify(c)) },
    getUsers(){ return JSON.parse(localStorage.getItem('smarklet_users')||'[]') },
    saveUsers(u){ localStorage.setItem('smarklet_users', JSON.stringify(u)) },
    getAuth(){ return JSON.parse(localStorage.getItem('smarklet_auth')||'null') },
    setAuth(a){ localStorage.setItem('smarklet_auth', JSON.stringify(a)) },
    clearAuth(){ localStorage.removeItem('smarklet_auth') }
  };

  // render products
  function renderProducts(list){
    productsGrid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.img}" alt="${escapeHtml(p.title)}" loading="lazy" />
        <h3>${escapeHtml(p.title)}</h3>
        <p class="price">₹${formatPrice(p.price)}</p>
        <p>${escapeHtml(shorten(p.desc, 80))}</p>
        <div class="card-actions">
          <button class="btn" data-id="${p.id}" data-action="view">View</button>
          <button class="btn alt" data-id="${p.id}" data-action="add">Add</button>
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  // initial render
  renderProducts(products);

  // utility
  function formatPrice(n){ return n.toFixed(2) }
  function shorten(s,n){ return s.length>n? s.slice(0,n-1)+'…': s }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])) }

  // open product modal
  function openProductModal(productId){
    const p = products.find(x=>x.id==productId);
    if(!p) return;
    currentProduct = p;
    modalImage.src = p.img;
    modalTitle.textContent = p.title;
    modalDesc.textContent = p.desc;
    modalPrice.textContent = `₹${formatPrice(p.price)}`;
    modalQty.value = 1;
    productModal.classList.remove('hidden');
  }

  // close modal
  closeProductModal.addEventListener('click',()=> productModal.classList.add('hidden'));
  productModal.addEventListener('click',(e)=> { if(e.target===productModal) productModal.classList.add('hidden') });

  // product grid click (delegation)
  productsGrid.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if(action==='view'){ openProductModal(id) }
    else if(action==='add'){ addToCart(id,1); showCart(); }
  });

  // add to cart from modal
  addToCartBtn.addEventListener('click', ()=>{
    if(!currentProduct) return;
    const q = Math.max(1, parseInt(modalQty.value||1));
    addToCart(currentProduct.id, q);
    productModal.classList.add('hidden');
    showCart();
  });

  // buy now - add and go to cart/checkout
  buyNowBtn.addEventListener('click', ()=>{
    if(!currentProduct) return;
    const q = Math.max(1, parseInt(modalQty.value||1));
    addToCart(currentProduct.id, q);
    productModal.classList.add('hidden');
    showCart();
  });

  // add to cart helper
  function addToCart(id, qty=1){
    const p = products.find(x=>x.id==id);
    if(!p) return;
    const cart = storage.getCart();
    const existing = cart.find(it=>it.id==p.id);
    if(existing) existing.qty += qty;
    else cart.push({ id:p.id, title:p.title, price:p.price, img:p.img, qty: qty });
    storage.saveCart(cart);
    updateCartCount();
  }

  // update cart count
  function updateCartCount(){
    const cart = storage.getCart();
    const count = cart.reduce((s,i)=>s+i.qty,0);
    cartCount.textContent = count;
  }

  // render cart
  function renderCart(){
    const cart = storage.getCart();
    cartItemsDiv.innerHTML = '';
    if(cart.length===0){
      cartItemsDiv.innerHTML = `<p style="color:var(--muted);padding:12px;text-align:center">Your cart is empty.</p>`;
    } else {
      cart.forEach(item=>{
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <img src="${item.img}" alt="${escapeHtml(item.title)}" />
          <div class="meta">
            <h4>${escapeHtml(item.title)}</h4>
            <p>₹${formatPrice(item.price)} × ${item.qty} = ₹${formatPrice(item.price*item.qty)}</p>
            <div class="qty-controls">
              <button data-id="${item.id}" class="dec">-</button>
              <div style="min-width:28px;text-align:center">${item.qty}</div>
              <button data-id="${item.id}" class="inc">+</button>
              <button data-id="${item.id}" class="remove" style="margin-left:8px;background:transparent;color:var(--muted);border:1px solid #eee;padding:6px;border-radius:8px">Remove</button>
            </div>
          </div>
        `;
        cartItemsDiv.appendChild(el);
      });
    }

    // totals
    const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    subtotalEl.textContent = `₹${formatPrice(subtotal)}`;
    taxEl.textContent = `₹${formatPrice(tax)}`;
    totalAmountEl.textContent = `₹${formatPrice(total)}`;
  }

  // cart items click (delegation for inc/dec/remove)
  cartItemsDiv.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = Number(btn.dataset.id);
    let cart = storage.getCart();
    const idx = cart.findIndex(i=>i.id==id);
    if(idx===-1) return;
    if(btn.classList.contains('inc')) cart[idx].qty++;
    else if(btn.classList.contains('dec')) {
      cart[idx].qty = Math.max(1, cart[idx].qty-1);
    } else if(btn.classList.contains('remove')) {
      cart.splice(idx,1);
    }
    storage.saveCart(cart);
    renderCart();
    updateCartCount();
  });

  // cart open/close
  cartToggle.addEventListener('click', ()=> {
    showCart();
  });
  closeCart.addEventListener('click', ()=> cartSidebar.classList.add('hidden'));

  function showCart(){
    renderCart();
    cartSidebar.classList.remove('hidden');
  }

  // checkout
  checkoutBtn.addEventListener('click', ()=>{
    const auth = storage.getAuth();
    const cart = storage.getCart();
    if(cart.length===0){ alert('Your cart is empty. Add some items first.'); return; }
    if(!auth){ // not signed in
      alert('Please sign in or sign up before checkout.');
      openAuth('signin');
      return;
    }
    // simulate checkout
    const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    // clear cart after checkout
    storage.saveCart([]);
    updateCartCount();
    renderCart();
    alert(`Thank you, ${auth.name}! Your order (₹${formatPrice(total)}) has been placed.`);
    cartSidebar.classList.add('hidden');
  });

  // auth modal controls
  signinBtn.addEventListener('click', ()=> openAuth('signin'));
  signupBtn.addEventListener('click', ()=> openAuth('signup'));
  closeAuthModal.addEventListener('click', ()=> authModal.classList.add('hidden'));
  showSignup.addEventListener('click', (e)=>{ e.preventDefault(); toggleAuthForms('signup'); });
  showSignin.addEventListener('click', (e)=>{ e.preventDefault(); toggleAuthForms('signin'); });

  function openAuth(mode='signin'){
    authModal.classList.remove('hidden');
    toggleAuthForms(mode);
  }
  function toggleAuthForms(mode){
    if(mode==='signin'){
      signinForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      signupForm.classList.remove('hidden');
      signinForm.classList.add('hidden');
    }
  }

  // signup submit
  signupForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const pwd = document.getElementById('signupPassword').value;
    if(!name || !email || !pwd) return alert('Please fill all fields.');
    let users = storage.getUsers();
    if(users.some(u=>u.email===email)) return alert('Email already registered.');
    const user = { id: Date.now(), name, email, password: pwd };
    users.push(user);
    storage.saveUsers(users);
    storage.setAuth({ id:user.id, name:user.name, email:user.email });
    authModal.classList.add('hidden');
    alert('Account created. Signed in as ' + user.name);
  });

  // signin submit
  signinForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = document.getElementById('signinEmail').value.trim().toLowerCase();
    const pwd = document.getElementById('signinPassword').value;
    let users = storage.getUsers();
    const user = users.find(u=>u.email===email && u.password===pwd);
    if(!user) return alert('Invalid credentials.');
    storage.setAuth({ id:user.id, name:user.name, email:user.email });
    authModal.classList.add('hidden');
    alert('Signed in as ' + user.name);
  });

  // initial auth UI
  function initAuthUI(){
    const auth = storage.getAuth();
    if(auth){
      signinBtn.textContent = auth.name;
      signupBtn.textContent = 'Logout';
      signupBtn.onclick = () => {
        if(confirm('Sign out?')){ storage.clearAuth(); location.reload(); }
      };
      signinBtn.onclick = ()=> { alert('Signed in as '+auth.name); };
    } else {
      signinBtn.textContent = 'Sign in';
      signupBtn.textContent = 'Sign up';
      signupBtn.onclick = ()=> openAuth('signup');
      signinBtn.onclick = ()=> openAuth('signin');
    }
  }

  initAuthUI();

  // update cart count from storage on load
  updateCartCount();

  // search filter
  searchInput.addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    const filtered = products.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    renderProducts(filtered);
  });

  // "Shop Now" scroll to products
  shopNow.addEventListener('click', ()=> {
    document.querySelector('.products-section').scrollIntoView({behavior:'smooth'});
  });

  // close product modal on ESC
  document.addEventListener('keydown', (e)=> {
    if(e.key==='Escape'){
      productModal.classList.add('hidden');
      authModal.classList.add('hidden');
      cartSidebar.classList.add('hidden');
    }
  });

  // small helper to pre-open product on double click (nice touch)
  productsGrid.addEventListener('dblclick', (e)=>{
    const card = e.target.closest('.card');
    if(card){
      const viewBtn = card.querySelector('button[data-action="view"]');
      if(viewBtn) viewBtn.click();
    }
  });

  // expose openProductModal for potential future use
  window.smark_openProduct = openProductModal;

})();
