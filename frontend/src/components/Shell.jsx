import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Shell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <div className="announcement">Small things, made to be kept <span>•</span> Free shipping over $75</div>
      <header className="site-header">
        <Link className="wordmark" to="/">morrow<span>market</span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/products">Shop all</NavLink>
          {user && <NavLink to="/orders">My orders</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="header-actions">
          {user ? <button className="text-button" onClick={signOut}>Sign out</button> : <Link className="text-button" to="/login">Sign in</Link>}
          <Link className="cart-link" to="/cart" aria-label="Shopping bag">Bag <span>↗</span></Link>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <Link className="wordmark" to="/">morrow<span>market</span></Link>
        <p>Good things for the everyday.</p>
        <span>© {new Date().getFullYear()} Morrow Market</span>
      </footer>
    </>
  )
}