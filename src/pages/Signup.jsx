import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstname: '', lastname: '', username: '', userrole: 'viewer', type: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError('');
      await signup(form);
      navigate('/');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm">First Name</label>
          <input className="input" value={form.firstname} onChange={e=>setForm({...form, firstname:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm">Last Name</label>
          <input className="input" value={form.lastname} onChange={e=>setForm({...form, lastname:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm">UserName</label>
          <input className="input" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
        </div>
        <div></div>
        <div>
          <label className="text-sm">Email</label>
          <input className="input" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input className="input" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm">I am a…</label>
          <select className="input" value={form.userrole} onChange={e=>setForm({...form, userrole:e.target.value})}>
            <option value="viewer">Viewer</option>
            <option value="creator">Creator</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" oncl disabled={loading}>{loading? 'Please wait…' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">Already have an account? <Link to="/login" className="text-brand-600">Login</Link></p>
    </div>
  );
}