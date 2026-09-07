import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          테이블오더 <span className="brand-sub">관리자</span>
        </div>
        <nav className="mainnav">
          <NavLink to="/" end>모니터링</NavLink>
          <NavLink to="/tables">테이블 관리</NavLink>
          <NavLink to="/menu">메뉴 관리</NavLink>
        </nav>
        <div className="topbar-right">
          <span className="who">{profile?.storeCode} · {profile?.username}</span>
          <button className="btn btn-ghost" onClick={onLogout}>로그아웃</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
