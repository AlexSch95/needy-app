import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ImageCropper from '../components/ImageCropper';
import { MaleIcon, FemaleIcon, UploadIcon } from '../components/Icons';

function CompleteProfile() {
    const { setProfileComplete, updateUser } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [gender, setGender] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Image cropper state
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

        if (!displayName || !gender || !profileImage) {
            setError('Bitte fuell alle Pflichtfelder aus');
            return;
        }

        setLoading(true);

        try {
            await api.completeProfile({
                displayName,
                gender,
                phoneNumber,
                profileImage,
                bio,
            });

            updateUser({ displayName, gender, phoneNumber, profileImage, bio });
            setProfileComplete();
            navigate('/discover');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="complete-profile-container">
                <div className="complete-profile-card">
                    <div className="auth-header">
                        <h1>Profil vervollstaendigen</h1>
                        <p>Erzaehl uns etwas ueber dich</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Profile Image */}
                        <div className="form-group">
                            <label>Profilbild *</label>
                            <div className="profile-image-section">
                                {profileImage ? (
                                    <img src={profileImage} alt="" className="profile-image-preview" />
                                ) : (
                                    <div className="profile-image-preview" />
                                )}
                                <label className="upload-btn">
                                    <UploadIcon />
                                    Bild auswaehlen
                                    <input type="file" accept="image/*" onChange={handleImageSelect} />
                                </label>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div className="form-group">
                            <label htmlFor="displayName">Anzeigename *</label>
                            <input
                                type="text"
                                id="displayName"
                                className="form-input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Wie sollen andere dich sehen?"
                                maxLength={100}
                                required
                            />
                        </div>

                        {/* Gender */}
                        <div className="form-group">
                            <label>Geschlecht * (nicht aenderbar)</label>
                            <div className="gender-select">
                                <button
                                    type="button"
                                    className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
                                    onClick={() => setGender('male')}
                                >
                                    <MaleIcon />
                                    <span>Maennlich</span>
                                </button>
                                <button
                                    type="button"
                                    className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
                                    onClick={() => setGender('female')}
                                >
                                    <FemaleIcon />
                                    <span>Weiblich</span>
                                </button>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="form-group">
                            <label htmlFor="phoneNumber">Telefonnummer (optional)</label>
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
                            <label htmlFor="bio">Ueber mich (optional)</label>
                            <textarea
                                id="bio"
                                className="form-input"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Erzaehl etwas ueber dich..."
                                maxLength={500}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Wird gespeichert...' : 'Profil speichern'}
                        </button>
                    </form>
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

export default CompleteProfile;
