import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PhoneIcon, TrashIcon, UsersIcon } from '../components/Icons';

function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModalMatch, setDeleteModalMatch] = useState(null);

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await api.getMatches();
            setMatches(data.matches);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async (matchId) => {
        try {
            await api.deleteMatch(matchId);
            setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
            setDeleteModalMatch(null);
        } catch (err) {
            setError(err.message);
            setDeleteModalMatch(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <h1>Matches</h1>
                </div>
                <p>Laden...</p>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1>Matches</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            {matches.length === 0 ? (
                <div className="no-profiles">
                    <UsersIcon />
                    <h2>Noch keine Matches</h2>
                    <p>Swipe weiter um dein erstes Match zu finden</p>
                </div>
            ) : (
                <div className="matches-grid">
                    {matches.map((match) => (
                        <div key={match.matchId} className="match-card">
                            <img
                                src={match.user.profileImage}
                                alt={match.user.displayName}
                                className="match-card-image"
                            />
                            <div className="match-card-info">
                                <h3 className="match-card-name">{match.user.displayName}</h3>
                                <p className="match-card-date">Match am {formatDate(match.matchedAt)}</p>

                                <div className="match-card-phone">
                                    <PhoneIcon />
                                    <input
                                        type="text"
                                        readOnly
                                        value={match.user.phoneNumber || 'nicht vorhanden'}
                                        onClick={(e) => e.target.select()}
                                    />
                                </div>

                                {match.user.bio && (
                                    <p className="swipe-card-bio" style={{ marginTop: '0.75rem' }}>
                                        {match.user.bio}
                                    </p>
                                )}
                            </div>
                            <button
                                className="match-card-delete"
                                onClick={() => setDeleteModalMatch(match)}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {deleteModalMatch && (
                <div className="modal-overlay" onClick={() => setDeleteModalMatch(null)}>
                    <div className="match-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Match entfernen</h2>
                        <p>Möchtest du das Match mit {deleteModalMatch.user.displayName} wirklich entfernen?</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteModalMatch(null)}
                            >
                                Abbrechen
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ background: 'var(--error)' }}
                                onClick={() => handleDeleteMatch(deleteModalMatch.matchId)}
                            >
                                Entfernen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Matches;
