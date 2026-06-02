import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { auth, db } from './firebaseConfig';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import {
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

const products = [
  { id: 'honey-cube', name: 'Honey Cube', category: 'Honeysuckle', price: 5, description: 'Sweet honeysuckle-inspired cube, perfect as a small treat or gift.', stock: 12, bestseller: true, emoji: '🍯' },
  { id: 'honey-pellet-sweeter', name: 'Honey Pellet Sweeter', category: 'Honeysuckle', price: 6, description: 'A stronger sweet option for honeysuckle lovers.', stock: 4, bestseller: false, emoji: '🟡' },
  { id: 'fresh-mint-leaves', name: 'Fresh Mint Leaves', category: 'Mint', price: 4.5, description: 'Fresh mint leaves for drinks, snacks, and refreshing add-ons.', stock: 9, bestseller: true, emoji: '🌿' },
  { id: 'mint-water', name: 'Mint Water', category: 'Mint', price: 3.5, description: 'Cool, refreshing mint water made for a clean taste.', stock: 0, bestseller: false, emoji: '💧' },
  { id: 'fruit-salad-small', name: 'Lime & Strawberry Fruit Salad — Small', category: 'Add Ons', price: 5, description: 'Fresh lime and strawberry fruit salad, small size.', stock: 8, bestseller: false, emoji: '🍓' },
  { id: 'fruit-salad-medium', name: 'Lime & Strawberry Fruit Salad — Medium', category: 'Add Ons', price: 10, description: 'Fresh lime and strawberry fruit salad, medium size.', stock: 5, bestseller: true, emoji: '🍓' },
  { id: 'fruit-salad-large', name: 'Lime & Strawberry Fruit Salad — Large', category: 'Add Ons', price: 15, description: 'Fresh lime and strawberry fruit salad, large size.', stock: 2, bestseller: false, emoji: '🍓' },
  { id: 'orange-juice-small', name: 'Fresh Orange Juice — Small', category: 'Add Ons', price: 0.5, description: 'Fresh orange juice, small size.', stock: 18, bestseller: false, emoji: '🍊' },
  { id: 'orange-juice-medium', name: 'Fresh Orange Juice — Medium', category: 'Add Ons', price: 1, description: 'Fresh orange juice, medium size.', stock: 15, bestseller: false, emoji: '🍊' },
  { id: 'orange-juice-large', name: 'Fresh Orange Juice — Large', category: 'Add Ons', price: 2, description: 'Fresh orange juice, large size.', stock: 7, bestseller: false, emoji: '🍊' },
  { id: 'lemonade-small', name: 'Fresh Lemonade — Small', category: 'Add Ons', price: 0.5, description: 'Fresh lemonade, small size.', stock: 20, bestseller: false, emoji: '🍋' },
  { id: 'lemonade-medium', name: 'Fresh Lemonade — Medium', category: 'Add Ons', price: 1, description: 'Fresh lemonade, medium size.', stock: 10, bestseller: false, emoji: '🍋' },
  { id: 'lemonade-large', name: 'Fresh Lemonade — Large', category: 'Add Ons', price: 2, description: 'Fresh lemonade, large size.', stock: 3, bestseller: false, emoji: '🍋' },
  { id: 'apple-juice-small', name: 'Fresh Apple Juice — Small', category: 'Add Ons', price: 0.5, description: 'Fresh apple juice, small size.', stock: 14, bestseller: false, emoji: '🍎' },
  { id: 'apple-juice-medium', name: 'Fresh Apple Juice — Medium', category: 'Add Ons', price: 1, description: 'Fresh apple juice, medium size.', stock: 8, bestseller: false, emoji: '🍎' },
  { id: 'apple-juice-large', name: 'Fresh Apple Juice — Large', category: 'Add Ons', price: 2, description: 'Fresh apple juice, large size.', stock: 2, bestseller: false, emoji: '🍎' }
];

const categories = ['All', 'Honeysuckle', 'Mint', 'Add Ons'];
const hours = [
  ['Monday - Friday', '3:30 PM - 7:30 PM'],
  ['Saturday', '10:00 AM - 6:00 PM'],
  ['Sunday', '12:00 PM - 5:00 PM']
];

function money(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function stockText(stock) {
  if (stock <= 0) return 'Sold Out';
  if (stock <= 3) return 'Low Stock';
  return 'In Stock';
}

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [cart, setCart] = useState(() => loadJson('ods-cart', {}));
  const [orders, setOrders] = useState(() => loadJson('ods-orders', []));
  const [delivery, setDelivery] = useState('pickup');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
 const [user, setUser] = useState(null);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [notice, setNotice] = useState('');

  useEffect(() => localStorage.setItem('ods-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('ods-orders', JSON.stringify(orders)), [orders]);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return unsubscribe;
}, []);

  const visibleProducts = useMemo(() => {
    let list = products.filter((p) => {
      const categoryMatch = category === 'All' || p.category === category;
      const query = search.trim().toLowerCase();
      const searchMatch = !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
    if (sort === 'bestseller') list = [...list].sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
    if (sort === 'priceLow') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'priceHigh') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'stock') list = [...list].sort((a, b) => b.stock - a.stock);
    return list;
  }, [category, search, sort]);

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find((p) => p.id === id);
      return product ? { ...product, quantity } : null;
    })
    .filter(Boolean);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = delivery === 'delivery' && subtotal > 0 ? 3 : 0;
  const total = subtotal + deliveryFee;

  function add(product) {
    if (product.stock <= 0) return;
    setCart((old) => {
      const current = old[product.id] || 0;
      if (current >= product.stock) return old;
      return { ...old, [product.id]: current + 1 };
    });
  }

  function subtract(id) {
    setCart((old) => {
      const current = old[id] || 0;
      const next = { ...old };
      if (current <= 1) delete next[id];
      else next[id] = current - 1;
      return next;
    });
  }

  function remove(id) {
    setCart((old) => {
      const next = { ...old };
      delete next[id];
      return next;
    });
  }

async function placeOrder() {
  if (cartItems.length === 0) return setNotice('Please add at least one item to the cart.');
  if (!name.trim()) return setNotice('Please enter the customer name.');
  if (!user) return setNotice('Please sign in first.');
  if (delivery === 'delivery' && !address.trim()) return setNotice('Please enter the delivery address.');

  const order = {
    customer: name,
    email: user.email,
    contact,
    address,
    method: delivery === 'pickup' ? 'Pickup' : 'Delivery',
    total,
    status: 'Pending',
    items: cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'orders'), order);
    setCart({});
    setNotice('Order saved to Firebase successfully.');
  } catch (err) {
    setNotice(`Firebase error: ${err.message}`);
  }
}
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">🌿</div>
          <div>
            <h1>OD's Honeysuckle & Mint</h1>
            <p>Fresh treats, drinks, and add-ons</p>
          </div>
        </div>
        <div className="cartPill">🛒 {itemCount}</div>
      </header>

      <main className="layout">
        <section className="left">
          <section className="hero">
            <div>
              <span className="eyebrow">⭐ Local fresh shop</span>
              <h2>Sweet honeysuckle. Cool mint. Fresh add-ons.</h2>
              <p>Browse products, add items to your cart, choose pickup or delivery, and keep track of orders.</p>
              <div className="heroButtons">
                <button onClick={() => setCategory('All')} className="primary">Shop all products</button>
                <button onClick={() => setCategory('Add Ons')} className="secondary">View add-ons</button>
              </div>
            </div>
            <div className="heroGrid">
              <div>🍯<span>Honeysuckle</span></div>
              <div>🌿<span>Mint</span></div>
              <div>🍓<span>Fruit</span></div>
              <div>🍋<span>Juice</span></div>
            </div>
          </section>

          <section className="featureRow">
            <div><b>📦 Stock tracking</b><span>Low-stock and sold-out badges.</span></div>
            <div><b>🚚 Pickup or delivery</b><span>Choose the order method.</span></div>
            <div><b>🧾 Order history</b><span>Orders save on this device.</span></div>
          </section>

          <section className="filters">
            <div className="chips">
              {categories.map((c) => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}
            </div>
            <div className="searchSort">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="bestseller">Best sellers</option>
                <option value="priceLow">Price: low to high</option>
                <option value="priceHigh">Price: high to low</option>
                <option value="stock">Most stock</option>
              </select>
            </div>
          </section>

          <section className="productGrid">
            {visibleProducts.map((p) => {
              const qty = cart[p.id] || 0;
              const status = stockText(p.stock);
              return (
                <article className="productCard" key={p.id}>
                  <div className="productTop">
                    <div className="emoji">{p.emoji}</div>
                    <div className="badges">
                      {p.bestseller && <span className="best">Best Seller</span>}
                      <span className={status === 'Sold Out' ? 'sold' : status === 'Low Stock' ? 'low' : 'stock'}>{status}</span>
                    </div>
                  </div>
                  <p className="category">{p.category}</p>
                  <h3>{p.name}</h3>
                  <p className="desc">{p.description}</p>
                  <div className="productBottom">
                    <div><strong>{money(p.price)}</strong><small>{p.stock} available</small></div>
                    {qty > 0 ? (
                      <div className="stepper">
                        <button onClick={() => subtract(p.id)}>-</button>
                        <b>{qty}</b>
                        <button onClick={() => add(p)} disabled={qty >= p.stock}>+</button>
                      </div>
                    ) : (
                      <button className="add" disabled={p.stock <= 0} onClick={() => add(p)}>{p.stock <= 0 ? 'Sold out' : 'Add'}</button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </section>

        <aside className="right">
          <section className="panel">
            <div className="panelHeader"><h2>Cart</h2><span>{itemCount} items</span></div>
            {cartItems.length === 0 ? <div className="empty">🛒 Your cart is empty.</div> : cartItems.map((item) => (
              <div className="cartItem" key={item.id}>
                <div className="cartLine"><b>{item.name}</b><button onClick={() => remove(item.id)}>Remove</button></div>
                <p>{money(item.price)} each</p>
                <div className="cartLine">
                  <div className="stepper"><button onClick={() => subtract(item.id)}>-</button><b>{item.quantity}</b><button onClick={() => add(item)} disabled={item.quantity >= item.stock}>+</button></div>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              </div>
            ))}
            <div className="totals">
              <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div><span>Delivery fee</span><b>{money(deliveryFee)}</b></div>
              <div className="grand"><span>Total</span><b>{money(total)}</b></div>
            </div>
          </section>

          <section className="panel">
            <h2>Checkout</h2>
            <div className="method">
              <button className={delivery === 'pickup' ? 'active' : ''} onClick={() => setDelivery('pickup')}>🏪 Pickup</button>
              <button className={delivery === 'delivery' ? 'active' : ''} onClick={() => setDelivery('delivery')}>🚚 Delivery</button>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone" />
            {delivery === 'delivery' && <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" />}
            <button className="primary full" onClick={placeOrder}>Place order</button>
            {notice && <p className="notice">{notice}</p>}
          </section>

        <section className="panel">
  <h2>Customer account</h2>
  {user ? (
    <div className="success">
      <b>Signed in</b>
      <p>{user.email}</p>
      <button onClick={() => signOut(auth)}>Sign out</button>
    </div>
  ) : (
    <>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button className="secondary full" onClick={() => signInWithEmailAndPassword(auth, email, password)}>
        Sign in
      </button>
      <button className="secondary full" onClick={() => createUserWithEmailAndPassword(auth, email, password)}>
        Create account
      </button>
    </>
  )}
</section>

          <section className="panel">
            <h2>Business hours</h2>
            {hours.map(([day, time]) => <div className="hour" key={day}><b>{day}</b><span>{time}</span></div>)}
          </section>

          <section className="panel">
            <h2>Order history</h2>
            {orders.length === 0 ? <p className="muted">No orders yet.</p> : orders.map((order) => (
              <div className="order" key={order.id}>
                <div className="cartLine"><b>{order.id}</b><span>{order.status}</span></div>
                <small>{order.date} • {order.method}</small>
                <p>{order.items}</p>
                <strong>{money(order.total)}</strong>
              </div>
            ))}
          </section>
        </aside>
      </main>

     <footer>© 2026 OD's Honeysuckle & Mint Products. Fresh products available for pickup or shipping.</footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
