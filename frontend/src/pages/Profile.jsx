import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ImageCropper from '../components/ImageCropper';
import { UploadIcon, MaleIcon, FemaleIcon, TrashIcon } from '../components/Icons';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Bild darf maximal 5MB gross sein');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  const handleCropComplete = useCallback((croppedImage) => {
    setProfileImage(croppedImage);
    setImageToCrop(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!displayName) {
      setError('Anzeigename ist erforderlich');
      return;
    }

    setLoading(true);

    try {
      await api.updateProfile({
        displayName,
        phoneNumber,
        profileImage,
        bio,
      });
      
      updateUser({ displayName, phoneNumber, profileImage, bio });
      setSuccess('Profil erfolgreich aktualisiert');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Account wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.')) {
      return;
    }

    try {
      await api.deleteAccount();
      logout();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Profil</h1>
      </div>

      <div className="profile-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Profile Image */}
          <div className="form-group">
            <label>Profilbild</label>
            <div className="profile-image-section">
              {profileImage ? (
                <img src={profileImage} alt="" className="profile-image-preview" />
              ) : (
                <div className="profile-image-preview" />
              )}
              <label className="upload-btn">
                <UploadIcon />
                Bild aendern
                <input type="file" accept="image/*" onChange={handleImageSelect} />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="displayName">Anzeigename</label>
            <input
              type="text"
              id="displayName"
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dein Anzeigename"
              maxLength={100}
              required
            />
          </div>

          {/* Gender (read-only) */}
          <div className="form-group">
            <label>Geschlecht (nicht aenderbar)</label>
            <div className="gender-select">
              <div className={`gender-option disabled ${user?.gender === 'male' ? 'selected' : ''}`}>
                <MaleIcon />
                <span>Maennlich</span>
              </div>
              <div className={`gender-option disabled ${user?.gender === 'female' ? 'selected' : ''}`}>
                <FemaleIcon />
                <span>Weiblich</span>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Telefonnummer</label>
            <input
              type="tel"
              id="phoneNumber"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nur fuer Matches sichtbar"
            />
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="bio">Ueber mich</label>
            <textarea
              id="bio"
              className="form-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Erzaehl etwas ueber dich..."
              maxLength={500}
            />
          </div>

          {/* Username (read-only) */}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-input"
              value={user?.username || ''}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          {/* FiveM UUID (read-only) */}
          {user?.fivemUuid && (
            <div className="form-group">
              <label>FiveM UUID</label>
              <input
                type="text"
                className="form-input"
                value={user.fivemUuid}
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Wird gespeichert...' : 'Aenderungen speichern'}
          </button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <button
            className="btn btn-secondary"
            style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
            onClick={handleDeleteAccount}
          >
            <TrashIcon />
            Account loeschen
          </button>
        </div>
      </div>

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
        />
      )}
    </>
  );
}

export default Profile;
