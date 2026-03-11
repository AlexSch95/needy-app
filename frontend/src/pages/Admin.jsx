import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';
import { SearchIcon, TrashIcon, UserIcon } from '../components/Icons';

function Admin() {
    const { isAdmin } = useAuth();
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteModalUser, setDeleteModalUser] = useState(null);

    if (!isAdmin) {
        return <Navigate to="/discover" />;
    }

    const handleSearch = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError('');
        setSelectedUser(null);
        setUserDetails(null);

        try {
            const data = await api.adminSearchUsers(search);
            setUsers(data.users);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setLoading(true);

        try {
            const data = await api.adminGetUser(user.id);
            setUserDetails(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await api.adminDeleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setSelectedUser(null);
            setUserDetails(null);
            setDeleteModalUser(null);
        } catch (err) {
            setError(err.message);
            setDeleteModalUser(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <div className="page-header">
                <h1>Admin</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="admin-container">
                <form className="admin-search" onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        <SearchIcon />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Username, UUID, Name oder Telefon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        Suchen
                    </button>
                </form>

                <div className="admin-content">
                    <div className="admin-list">
                        <h3>Ergebnisse ({users.length})</h3>
                        {users.length === 0 ? (
                            <p className="admin-empty">Keine User gefunden</p>
                        ) : (
                            <div className="admin-user-list">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`admin-user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectUser(user)}
                                    >
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt="" className="admin-user-avatar" />
                                        ) : (
                                            <div className="admin-user-avatar">
                                                <UserIcon />
                                            </div>
                                        )}
                                        <div className="admin-user-info">
                                            <span className="admin-user-name">
                                                {user.displayName || user.username}
                                            </span>
                                            <span className="admin-user-username">@{user.username}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="admin-details">
                        {selectedUser && userDetails ? (
                            <>
                                <div className="admin-detail-header">
                                    {userDetails.user.profileImage ? (
                                        <img
                                            src={userDetails.user.profileImage}
                                            alt=""
                                            className="admin-detail-avatar"
                                        />
                                    ) : (
                                        <div className="admin-detail-avatar">
                                            <UserIcon />
                                        </div>
                                    )}
                                    <div>
                                        <h2>{userDetails.user.displayName || userDetails.user.username}</h2>
                                        <p>@{userDetails.user.username}</p>
                                    </div>
                                </div>

                                <div className="admin-detail-section">
                                    <h4>Details</h4>
                                    <div className="admin-detail-grid">
                                        <div className="admin-detail-item">
                                            <span className="label">ID</span>
                                            <span className="value">{userDetails.user.id}</span>
                                        </div>
                                        <div className="admin-detail-item">
                                            <span className="label">UUID</span>
                                            <span className="value">{userDetails.user.uuid || '-'}</span>
                                        </div>
                                        <div className="admin-detail-item">
                                            <span className="label">Geschlecht</span>
                                            <span className="value">
                                                {userDetails.user.gender === 'male'
                                                    ? 'Maennlich'
                                                    : userDetails.user.gender === 'female'
                                                        ? 'Weiblich'
                                                        : '-'}
                                            </span>
                                        </div>
                                        <div className="admin-detail-item">
                                            <span className="label">Telefon</span>
                                            <span className="value">{userDetails.user.phoneNumber || '-'}</span>
                                        </div>
                                        <div className="admin-detail-item">
                                            <span className="label">Profil komplett</span>
                                            <span className="value">
                                                {userDetails.user.isProfileComplete ? 'Ja' : 'Nein'}
                                            </span>
                                        </div>
                                        <div className="admin-detail-item">
                                            <span className="label">Registriert</span>
                                            <span className="value">{formatDate(userDetails.user.createdAt)}</span>
                                        </div>
                                    </div>

                                    {userDetails.user.bio && (
                                        <div className="admin-detail-bio">
                                            <span className="label">Bio</span>
                                            <p>{userDetails.user.bio}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="admin-detail-section">
                                    <h4>Matches ({userDetails.matches.length})</h4>
                                    {userDetails.matches.length === 0 ? (
                                        <p className="admin-empty">Keine Matches</p>
                                    ) : (
                                        <div className="admin-matches-list">
                                            {userDetails.matches.map((match) => (
                                                <div key={match.id} className="admin-match-item">
                                                    <span>{match.matchedDisplayName}</span>
                                                    <span className="admin-match-date">
                                                        {formatDate(match.matchedAt)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="admin-detail-actions">
                                    <button
                                        className="btn btn-secondary"
                                        style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                                        onClick={() => setDeleteModalUser(userDetails.user)}
                                    >
                                        <TrashIcon />
                                        User loeschen
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-details">
                                <UserIcon />
                                <p>Waehle einen User aus der Liste</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {deleteModalUser && (
                <div className="modal-overlay" onClick={() => setDeleteModalUser(null)}>
                    <div className="match-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ color: 'var(--error)' }}>User loeschen</h2>
                        <p>
                            Moechtest du den User "{deleteModalUser.displayName || deleteModalUser.username}" wirklich
                            loeschen?
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteModalUser(null)}>
                                Abbrechen
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ background: 'var(--error)' }}
                                onClick={() => handleDeleteUser(deleteModalUser.id)}
                            >
                                Loeschen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Admin;
