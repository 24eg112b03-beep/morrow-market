import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, errorMessage, money } from './api.js'
import { useAuth } from './context/AuthContext.jsx'

const fallbackImage = 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=80'

function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product.id}`}>
      <div className="product-image-wrap">
        <img src={product.image || fallbackImage} alt={product.name} onError={(event) => { event.currentTarget.src = fallbackImage }} />
        {product.quantity === 0 && <span className="image-label">Sold out</span>}
      </div>
      <div className="product-card-meta"><h3>{product.name}</h3><span>{money(product.price)}</span></div>
      <p>{product.description}</p>
    </Link>
  )
}

function ProductGrid({ products }) {
  if (!products.length) return <div className="empty-state"><h3>Nothing on this shelf yet.</h3><p>Try a different search.</p></div>
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
}

export function HomePage() {
  const [products, setProducts] = useState([])
  useEffect(() => { api.get('/products').then(({ data }) => setProducts(data.slice(0, 3))).catch(() => {}) }, [])

  return (
    <>
      <section className="hero">
        <img className="hero-image" src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=2200&q=88" alt="A sunlit, thoughtfully arranged home" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="eyebrow light">Objects for slower living</span>
          <h1>Make room<br />for the good.</h1>
          <p>Useful, well-made things that make an ordinary day feel a little more yours.</p>
          <Link className="button button-light" to="/products">Explore the collection <span>↗</span></Link>
        </div>
        <span className="hero-index">01 / THE EVERYDAY EDIT</span>
      </section>
      <section className="section-shell featured-section">
        <div className="section-heading"><div><span className="eyebrow">A considered collection</span><h2>At home in your everyday.</h2></div><Link className="underlined-link" to="/products">Shop everything ↗</Link></div>
        <ProductGrid products={products} />
      </section>
      <section className="quote-band"><span className="eyebrow">A little less, a little better</span><p>“Buy fewer things. Choose well. Make them last.”</p><span>— The Morrow note</span></section>
    </>
  )
}

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/products', { params: search.trim() ? { search: search.trim() } : {} })
      .then(({ data }) => { setProducts(data); setError('') })
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <section className="section-shell listing-page">
      <div className="listing-title"><div><span className="eyebrow">Find your next favorite</span><h1>The collection</h1></div><span className="result-count">{products.length} pieces</span></div>
      <label className="search-box"><span>⌕</span><input aria-label="Search products" placeholder="Search by name" value={search} onChange={(event) => { setSearch(event.target.value); setParams(event.target.value ? { search: event.target.value } : {}) }} /><kbd>SEARCH</kbd></label>
      {error && <p className="form-error">{error}</p>}
      {loading ? <div className="page-message">Finding the good stuff…</div> : <ProductGrid products={products} />}
    </section>
  )
}

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => { api.get(`/products/${id}`).then(({ data }) => setProduct(data)).catch(() => setProduct(null)).finally(() => setLoading(false)) }, [id])

  async function addToBag() {
    if (!user) return navigate('/login')
    try {
      await api.post('/cart/items', { productId: product.id, quantity })
      setMessage('Added to your bag.')
    } catch (error) { setMessage(errorMessage(error)) }
  }

  if (loading) return <div className="page-message">Loading piece…</div>
  if (!product) return <div className="page-message">We couldn't find that piece. <Link to="/products">Back to the collection</Link></div>

  return (
    <section className="section-shell detail-layout">
      <div className="detail-image"><img src={product.image || fallbackImage} alt={product.name} /></div>
      <div className="detail-copy"><Link className="back-link" to="/products">← Back to the collection</Link><span className="eyebrow">Morrow essentials · No. {String(product.id).padStart(3, '0')}</span><h1>{product.name}</h1><p className="detail-price">{money(product.price)}</p><p className="detail-description">{product.description}</p><p className="stock-note">{product.quantity > 0 ? `${product.quantity} ready to ship` : 'Currently out of stock'}</p>
        <div className="detail-actions"><label className="quantity-control">Qty <input type="number" min="1" max={product.quantity} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(product.quantity || 1, Number(event.target.value))))} /></label><button className="button button-dark" disabled={!product.quantity} onClick={addToBag}>Add to bag <span>↗</span></button></div>
        {message && <p className="inline-message">{message}</p>}<div className="detail-perks"><span>Thoughtful materials</span><span>Cash on delivery</span><span>Easy order tracking</span></div>
      </div>
    </section>
  )
}

export function LoginPage() {
  const [registerMode, setRegisterMode] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (registerMode) await register(form)
      await login({ email: form.email, password: form.password })
      navigate('/')
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }

  return (
    <section className="auth-page">
      <div className="auth-photo"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85" alt="A warm independent shop" /><div><span className="eyebrow light">A good place to begin</span><p>Find the pieces<br />you'll reach for.</p></div></div>
      <div className="auth-panel"><span className="eyebrow">Welcome to Morrow</span><h1>{registerMode ? 'Make yourself at home.' : 'Good to see you.'}</h1><p className="auth-intro">{registerMode ? 'Create an account to keep your orders close.' : 'Sign in to pick up where you left off.'}</p>
        <form className="form-stack" onSubmit={submit}>
          {registerMode && <label>Your name<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
          <label>Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input required type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-dark full-button" disabled={busy}>{busy ? 'One moment…' : registerMode ? 'Create account' : 'Sign in'} <span>↗</span></button>
        </form>
        <p className="auth-switch">{registerMode ? 'Already a member?' : 'New around here?'} <button onClick={() => { setRegisterMode(!registerMode); setError('') }}>{registerMode ? 'Sign in' : 'Create an account'}</button></p>
        {!registerMode && <p className="demo-login">Admin demo: admin@example.com / admin1234</p>}
      </div>
    </section>
  )
}

export function CartPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [placing, setPlacing] = useState(false)

  async function loadCart() {
    if (!user) { setItems([]); setLoading(false); return }
    try { const { data } = await api.get('/cart'); setItems(data) }
    catch (error) { setMessage(errorMessage(error)) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCart() }, [user])
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  async function remove(itemId) {
    try { await api.delete(`/cart/items/${itemId}`); await loadCart() }
    catch (error) { setMessage(errorMessage(error)) }
  }

  async function placeOrder() {
    setPlacing(true)
    try { await api.post('/orders'); navigate('/orders', { state: { placed: true } }) }
    catch (error) { setMessage(errorMessage(error)); await loadCart() }
    finally { setPlacing(false) }
  }

  if (!user) return <section className="section-shell empty-page"><span className="eyebrow">Your bag</span><h1>A little something for later?</h1><p>Sign in to see your bag and place your order.</p><Link className="button button-dark" to="/login">Sign in to continue <span>↗</span></Link></section>
  if (loading) return <div className="page-message">Opening your bag…</div>

  return (
    <section className="section-shell cart-page">
      <div className="listing-title"><div><span className="eyebrow">Nearly yours</span><h1>Your bag <span className="title-count">({items.length})</span></h1></div><Link className="underlined-link" to="/products">Keep browsing ↗</Link></div>
      {message && <p className="form-error">{message}</p>}
      {!items.length ? <div className="empty-state"><h2>Your bag is taking a breather.</h2><p>Find something lovely to bring home.</p><Link className="underlined-link" to="/products">Explore the collection ↗</Link></div> : <div className="cart-layout">
        <div className="cart-lines">{items.map((item) => <article className="cart-line" key={item.id}><img src={item.image || fallbackImage} alt={item.name} /><div className="cart-line-info"><Link to={`/products/${item.productId}`}>{item.name}</Link><span>{money(item.price)} · Qty {item.quantity}</span><button className="plain-link" onClick={() => remove(item.id)}>Remove</button></div><strong>{money(item.price * item.quantity)}</strong></article>)}</div>
        <aside className="order-summary"><span className="eyebrow">The details</span><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Delivery</span><strong>Complimentary</strong></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><p>Payment is collected on delivery. No online payment needed.</p><button className="button button-dark full-button" onClick={placeOrder} disabled={placing}>{placing ? 'Placing order…' : 'Place COD order'} <span>↗</span></button></aside>
      </div>}
    </section>
  )
}

function OrderCard({ order }) {
  return <article className="order-card"><div className="order-card-head"><div><span className="eyebrow">Order #{order.id}</span><p>{new Date(order.orderDate).toLocaleString()}</p></div><span className={`status status-${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span></div><div className="order-items">{order.items.map((item, index) => <div key={`${order.id}-${index}`}><span>{item.name} <small>× {item.quantity}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="order-total"><span>Cash on delivery · Total</span><strong>{money(order.totalAmount)}</strong></div></article>
}

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const location = useLocation()
  useEffect(() => { api.get('/orders').then(({ data }) => setOrders(data)).catch((cause) => setError(errorMessage(cause))) }, [])
  return <section className="section-shell listing-page"><div className="listing-title"><div><span className="eyebrow">The paper trail</span><h1>Your orders</h1></div></div>{location.state?.placed && <p className="success-note">Your order is in. Pay by cash when it arrives.</p>}{error && <p className="form-error">{error}</p>}{!orders.length && !error ? <div className="empty-state"><h2>No orders just yet.</h2><p>Your next favorite is waiting to be found.</p><Link className="underlined-link" to="/products">Start browsing ↗</Link></div> : <div className="orders-list">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>}</section>
}

export function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  useEffect(() => { api.get('/products').then(({ data }) => setProducts(data)); api.get('/orders/admin').then(({ data }) => setOrders(data)) }, [])
  return <section className="section-shell admin-page"><span className="eyebrow">Store operations</span><h1>Good morning, admin.</h1><p className="admin-lede">A quick look at how the shop is doing.</p><div className="stats-row"><div><span>Live products</span><strong>{products.length}</strong></div><div><span>Total orders</span><strong>{orders.length}</strong></div><div><span>Needs attention</span><strong>{orders.filter((order) => ['PLACED', 'PROCESSING'].includes(order.orderStatus)).length}</strong></div></div><div className="admin-links"><Link to="/admin/products"><span>01</span><strong>Manage products</strong><small>Add, edit, and remove items</small><span>↗</span></Link><Link to="/admin/orders"><span>02</span><strong>Manage orders</strong><small>Review customers and update delivery status</small><span>↗</span></Link></div></section>
}

export function AdminProducts() {
  const emptyForm = { name: '', description: '', price: '', quantity: '', image: '' }
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadProducts() {
    const { data } = await api.get('/products')
    setProducts(data)
  }
  useEffect(() => { loadProducts().catch((cause) => setError(errorMessage(cause))) }, [])

  function edit(product) {
    setEditingId(product.id)
    setForm({ name: product.name, description: product.description, price: product.price, quantity: product.quantity, image: product.image || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const body = { ...form, price: Number(form.price), quantity: Number(form.quantity) }
      if (editingId) await api.put(`/products/${editingId}`, body)
      else await api.post('/products', body)
      setMessage(editingId ? 'Product updated.' : 'Product added.')
      setForm(emptyForm)
      setEditingId(null)
      await loadProducts()
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function remove(product) {
    if (!window.confirm(`Delete “${product.name}”?`)) return
    setError('')
    try { await api.delete(`/products/${product.id}`); setMessage('Product removed.'); await loadProducts() }
    catch (cause) { setError(errorMessage(cause)) }
  }

  return <section className="section-shell admin-page"><Link className="back-link" to="/admin">← Dashboard</Link><div className="listing-title admin-title"><div><span className="eyebrow">Store inventory</span><h1>Manage products</h1></div><span className="result-count">{products.length} items</span></div>
    <form className="admin-form" onSubmit={submit}><div className="form-title"><h2>{editingId ? 'Edit this product' : 'Add a product'}</h2>{editingId && <button className="plain-link" type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancel edit</button>}</div><div className="admin-form-grid"><label>Product name<input required maxLength="150" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Price (USD)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Quantity<input required type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label>Image URL<input type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label><label className="wide-field">Description<textarea required maxLength="2000" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div>{error && <p className="form-error">{error}</p>}{message && <p className="success-note">{message}</p>}<button className="button button-dark">{editingId ? 'Save changes' : 'Add product'} <span>↗</span></button></form>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Price</th><th>In stock</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><img src={product.image || fallbackImage} alt="" /><span>{product.name}</span></div></td><td>{money(product.price)}</td><td>{product.quantity}</td><td><div className="row-actions"><button className="plain-link" onClick={() => edit(product)}>Edit</button><button className="plain-link danger-link" onClick={() => remove(product)}>Delete</button></div></td></tr>)}</tbody></table></div>
  </section>
}

export function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  async function loadOrders() { const { data } = await api.get('/orders/admin'); setOrders(data) }
  useEffect(() => { loadOrders().catch((cause) => setError(errorMessage(cause))) }, [])

  async function updateStatus(order, status) {
    setBusyId(order.id)
    setError('')
    try { await api.patch(`/orders/admin/${order.id}/status`, { status }); await loadOrders() }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setBusyId(null) }
  }

  return <section className="section-shell admin-page"><Link className="back-link" to="/admin">← Dashboard</Link><div className="listing-title admin-title"><div><span className="eyebrow">Fulfillment</span><h1>Manage orders</h1></div><span className="result-count">{orders.length} orders</span></div>{error && <p className="form-error">{error}</p>}{!orders.length && !error ? <div className="empty-state"><h2>No orders have come through yet.</h2></div> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><div><span className="eyebrow">Order #{order.id} · {new Date(order.orderDate).toLocaleString()}</span><p>{order.customerName} · {order.customerEmail}</p></div><strong>{money(order.totalAmount)}</strong></div><div className="admin-order-bottom"><div className="order-items">{order.items.map((item, index) => <div key={`${order.id}-${index}`}><span>{item.name} <small>× {item.quantity}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><label className="status-select">Order status<select value={order.orderStatus} disabled={busyId === order.id} onChange={(event) => updateStatus(order, event.target.value)}>{['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}</select></label></div></article>)}</div>}</section>
}