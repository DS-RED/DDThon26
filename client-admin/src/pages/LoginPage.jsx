import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const DEFAULT_STORE = import.meta.env.VITE_DEFAULT_STORE_CODE || 'demo-001';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [storeCode, setStoreCode] = useState(DEFAULT_STORE);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login({ storeCode: storeCode.trim(), username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.status === 429 ? err.message : '로그인에 실패했습니다. 매장코드·아이디·비밀번호를 확인하세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <h1 className="login-title">테이블오더 <span>관리자</span></h1>
        <p className="login-desc">매장 계정으로 로그인하세요.</p>

        <label className="field">
          <span>매장 코드</span>
          <input value={storeCode} onChange={(e) => setStoreCode(e.target.value)} autoComplete="off" required />
        </label>
        <label className="field">
          <span>아이디</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" required />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </button>

        <p className="login-hint">데모: <code>demo-001</code> / <code>admin</code> / <code>admin1234</code></p>
      </form>
    </div>
  );
}
