import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold">Scalable Video</Link>
        <nav className="flex items-center gap-4">
          <NavLink to="/" className={({ isActive }) => `text-sm ${isActive ? 'text-brand-600' : 'text-gray-600'}`}>Feed</NavLink>
          {user?.userrole === 'creator' && (
            <>
            <NavLink to="/upload" className={({ isActive }) => `text-sm ${isActive ? 'text-brand-600' : 'text-gray-600'}`}>Upload</NavLink>
            <NavLink to="/creator-feed" className={({ isActive }) => `text-sm ${isActive ? 'text-brand-600' : 'text-gray-600'}`}>My Videos</NavLink>
            </>
            
          )}
          {!user ? (
            <>
              <Link to="/login" className="text-sm text-gray-600">Login</Link>
              <Link to="/signup" className="btn text-sm">Create account</Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.email} <span className="ml-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700">{user.userrole}</span></span>
              <span className="text-sm text-gray-600">{user.email} <span className="ml-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700">{user.username}</span></span>
              <button className="text-sm text-gray-600 hover:text-gray-800" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}