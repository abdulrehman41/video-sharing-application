// tailwind.config.js
/*
/** @type {import('tailwindcss').Config} */


// index.html
/*
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scalable Video App</title>
  </head>
  <body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
*/
// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './state/AuthContext';
import CreatorFeed from './pages/CreatorFeed';

function PrivateRoute({ children, role }) {
  const { user: ctxUser } = useAuth();

  // Fallback to localStorage if context isn't populated yet
  const lsUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  const user = ctxUser ?? lsUser;

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Normalize role name from either `role` or `userrole`
  const userRole = String(user.role ?? user.userrole ?? "").toLowerCase();

  // If roles are provided, ensure user's role is allowed
  if (Array.isArray(role) && role.length > 0) {
    const allowed = role.map(r => String(r).toLowerCase());
    if (!allowed.includes(userRole)) {
      // send to a safe route that's not protected by this guard
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-6 flex-1 w-full">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute role={['viewer', 'creator']}>
                <Feed />
              </PrivateRoute>
            }
          />

          <Route
            path="/creator-feed"
            element={
              <PrivateRoute role={['viewer', 'creator']}>
                <CreatorFeed />
              </PrivateRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <PrivateRoute role={['creator']}>
                <Upload />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* <Route path="*" element={<Navigate to="/" />} /> */}
        </Routes>
      </main>
      <footer className="border-t bg-white/70 backdrop-blur sticky bottom-0">
        <div className="container mx-auto max-w-6xl px-4 py-3 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Scalable Video</span>
          <span>Built with Azure Functions + React</span>
        </div>
      </footer>
    </div>
  );
}
