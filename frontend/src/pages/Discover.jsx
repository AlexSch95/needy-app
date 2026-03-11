import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { HeartIcon, XIcon, SearchIcon } from '../components/Icons';

function Discover() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [showMatch, setShowMatch] = useState(false);
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);

  const loadNextProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    setSwipeDirection(null);

    try {
      const data = await api.getNextProfile();
      if (data.profile) {
        setProfile(data.profile);
        setNoMoreProfiles(false);
      } else {
        setProfile(null);
        setNoMoreProfiles(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNextProfile();
  }, [loadNextProfile]);

  const handleSwipe = async (direction) => {
    if (!profile || swipeDirection) return;

    setSwipeDirection(direction);

    try {
      const result = await api.swipe(profile.id, direction);
      
      if (result.isMatch) {
        setShowMatch(true);
      }
      
      // Wait for animation
      setTimeout(() => {
        loadNextProfile();
      }, 300);
    } catch (err) {
      setError(err.message);
      setSwipeDirection(null);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profile, swipeDirection]);

  if (loading && !profile) {
    return (
      <div className="discover-container">
        <div className="no-profiles">
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="discover-container">
        <div className="no-profiles">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={loadNextProfile}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (noMoreProfiles) {
    return (
      <div className="discover-container">
        <div className="no-profiles">
          <SearchIcon />
          <h2>Keine weiteren Profile</h2>
          <p>Schau spaeter nochmal vorbei</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Entdecken</h1>
      </div>

      <div className="discover-container">
        {profile && (
          <>
            <div className={`swipe-card-wrapper ${swipeDirection ? `swiping-${swipeDirection}` : ''}`}>
              <div className="swipe-card">
                <img
                  src={profile.profileImage}
                  alt={profile.displayName}
                  className="swipe-card-image"
                />
                <div className="swipe-card-info">
                  <h2 className="swipe-card-name">{profile.displayName}</h2>
                  {profile.bio && (
                    <p className="swipe-card-bio">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="swipe-actions">
              <button
                className="swipe-btn swipe-btn-left"
                onClick={() => handleSwipe('left')}
                disabled={!!swipeDirection}
                title="Nope (Pfeil links)"
              >
                <XIcon />
              </button>
              <button
                className="swipe-btn swipe-btn-right"
                onClick={() => handleSwipe('right')}
                disabled={!!swipeDirection}
                title="Like (Pfeil rechts)"
              >
                <HeartIcon />
              </button>
            </div>
          </>
        )}
      </div>

      {showMatch && (
        <div className="modal-overlay" onClick={() => setShowMatch(false)}>
          <div className="match-modal" onClick={(e) => e.stopPropagation()}>
            <h2>It's a Match!</h2>
            <p>Ihr moegt euch gegenseitig. Schau in deine Matches um die Telefonnummer zu sehen.</p>
            <button className="btn btn-primary" onClick={() => setShowMatch(false)}>
              Weiter swipen
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Discover;
