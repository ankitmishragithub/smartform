import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../css/AccountSettings.css';

const AccountSettings = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // For now, just show success message
      // In the future, you can add actual API calls here
      setSuccess('Profile updated successfully! (Demo mode)');
      
      // Clear form
      setFormData({
        username: user.username || '',
        email: user.email || ''
      });
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="account-settings">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Please log in to view your account settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-settings">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your account information</p>
      </div>

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      {success && (
        <div className="settings-success">
          {success}
        </div>
      )}

      <div className="settings-content">
        {/* Profile Information */}
        <div className="settings-section">
          <h2>Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="settings-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <button 
              type="submit" 
              className="settings-btn primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Account Information */}
        <div className="settings-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>User ID:</label>
              <span>{user._id || user.id || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Role:</label>
              <span className={`role-badge role-${user.role || 'user'}`}>
                {user.role || 'User'}
              </span>
            </div>
            <div className="info-item">
              <label>Username:</label>
              <span>{user.username || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user.email || 'N/A'}</span>
            </div>
            {user.createdAt && (
              <div className="info-item">
                <label>Account Created:</label>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {user.lastLogin && (
              <div className="info-item">
                <label>Last Login:</label>
                <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className="settings-section">
          <h2>Permissions</h2>
          <div className="permissions-grid">
            <div className="permission-item">
              <label>Forms Access:</label>
              <span className={`permission-badge ${user.permissions?.forms ? 'granted' : 'denied'}`}>
                {user.permissions?.forms ? '✓ Granted' : '✗ Denied'}
              </span>
            </div>
            <div className="permission-item">
              <label>Form Builder:</label>
              <span className={`permission-badge ${user.permissions?.formBuilder ? 'granted' : 'denied'}`}>
                {user.permissions?.formBuilder ? '✓ Granted' : '✗ Denied'}
              </span>
            </div>
            <div className="permission-item">
              <label>Folders:</label>
              <span className={`permission-badge ${user.permissions?.folders ? 'granted' : 'denied'}`}>
                {user.permissions?.folders ? '✓ Granted' : '✗ Denied'}
              </span>
            </div>
            <div className="permission-item">
              <label>Responses:</label>
              <span className={`permission-badge ${user.permissions?.responses ? 'granted' : 'denied'}`}>
                {user.permissions?.responses ? '✓ Granted' : '✗ Denied'}
              </span>
            </div>
            <div className="permission-item">
              <label>Reports:</label>
              <span className={`permission-badge ${user.permissions?.reports ? 'granted' : 'denied'}`}>
                {user.permissions?.reports ? '✓ Granted' : '✗ Denied'}
              </span>
            </div>
            <div className="permission-item">
              <label>Admin Access:</label>
              <span className={`permission-badge ${user.permissions?.admin ? 'granted' : 'denied'}`}>
                {user.permissions?.admin ? '✓ Granted' : '✗ Denied'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
