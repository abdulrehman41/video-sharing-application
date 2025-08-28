import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError('');
      await login(form);
      navigate('/');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm">Username</label>
          <input className="input" type="text" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input className="input" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={loading}>{loading? 'Please wait…' : 'Login'}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">No account? <Link to="/signup" className="text-brand-600">Sign up</Link></p>
    </div>
  );
}