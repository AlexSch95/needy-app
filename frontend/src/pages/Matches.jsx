import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PhoneIcon, TrashIcon, UsersIcon } from '../components/Icons';

function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        if (!confirm('Match wirklich entfernen?')) return;

        try {
            await api.deleteMatch(matchId);
            setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
        } catch (err) {
            setError(err.message);
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

                                {match.user.phoneNumber && (
                                    <div className="match-card-phone">
                                        <PhoneIcon />
                                        {match.user.phoneNumber}
                                    </div>
                                )}

                                {match.user.bio && (
                                    <p className="swipe-card-bio" style={{ marginTop: '0.75rem' }}>
                                        {match.user.bio}
                                    </p>
                                )}

                                <div className="match-card-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDeleteMatch(match.matchId)}
                                    >
                                        <TrashIcon />
                                        Entfernen
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default Matches;
