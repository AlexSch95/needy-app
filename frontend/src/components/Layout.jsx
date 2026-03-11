import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CompassIcon, UsersIcon, UserIcon, LogOutIcon, ShieldIcon } from './Icons';

function Layout() {
    const { user, isAdmin, logout } = useAuth();

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">Cringe</div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/discover"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <CompassIcon />
                        Entdecken
                    </NavLink>
                    <NavLink
                        to="/matches"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <UsersIcon />
                        Matches
                    </NavLink>
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <UserIcon />
                        Profil
                    </NavLink>
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <ShieldIcon />
                            Admin
                        </NavLink>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="" className="user-avatar" />
                        ) : (
                            <div className="user-avatar" />
                        )}
                        <span className="user-name">{user?.displayName || user?.username}</span>
                    </div>
                    <button className="btn logout-btn" onClick={logout}>
                        <LogOutIcon />
                        Abmelden
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
