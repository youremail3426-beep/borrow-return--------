import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/public/Home';
import CartPage from './pages/public/Cart';
import LoginPage from './pages/public/Login';
import ViewBorrowForm from './pages/public/ViewBorrowForm';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEquipment from './pages/admin/Equipment';
import AdminReservations from './pages/admin/Reservations';
import AdminBorrowReturn from './pages/admin/BorrowReturn';
import AdminHistory from './pages/admin/History';
import PrintBorrowForm from './pages/admin/PrintBorrowForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/view-form/:type/:id" element={<ViewBorrowForm />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/equipment" element={<AdminEquipment />} />
        <Route path="/admin/reservations" element={<AdminReservations />} />
        <Route path="/admin/borrow-return" element={<AdminBorrowReturn />} />
        <Route path="/admin/history" element={<AdminHistory />} />
        <Route path="/admin/print/:id" element={<PrintBorrowForm />} />
      </Routes>

      {/* Global Developer Credit */}
      <div className="fixed bottom-4 right-4 z-[999] pointer-events-none">
        <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium text-gray-500 border border-gray-100">
          พัฒนา เเละสร้างโดย นายชัยวัฒน์ จันทร์ขุน SMO 69
        </div>
      </div>
    </Router>
  );
}

export default App;
