import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from './components/Shell.jsx'
import { useAuth } from './context/AuthContext.jsx'
import {
  AdminDashboard, AdminOrders, AdminProducts, CartPage, HomePage,
  LoginPage, OrdersPage, ProductDetailPage, ProductsPage,
} from './pages.jsx'

function Protected({ admin = false, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-message">Opening the shop…</div>
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
        <Route path="/admin" element={<Protected admin><AdminDashboard /></Protected>} />
        <Route path="/admin/products" element={<Protected admin><AdminProducts /></Protected>} />
        <Route path="/admin/orders" element={<Protected admin><AdminOrders /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}