import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../css/ViewProfile.css';

const ViewProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="view-profile">
        <div className="profile-header">
          <h1>View Profile</h1>
          <p>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-profile">
      <div className="profile-header">
        <h4>Your Profile</h4>
        <p>Your account information and details</p>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <span className="avatar-text">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          
          <div className="profile-info">
            <h2 className="profile-name">{user?.username || 'User'}</h2>
            <p className="profile-email">{user?.email || 'user@example.com'}</p>
            <div className="profile-role">
              <span className={`role-badge role-${user?.role || 'user'}`}>
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <div className="detail-section">
            <h3>Account Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>User ID:</label>
                <span>{user._id || user.id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Username:</label>
                <span>{user?.username || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Role:</label>
                <span className={`role-badge role-${user?.role || 'user'}`}>
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </div>
              {user?.createdAt && (
                <div className="detail-item">
                  <label>Account Created:</label>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {user?.lastLogin && (
                <div className="detail-item">
                  <label>Last Login:</label>
                  <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Summary */}
          <div className="detail-section">
            <h3>Access Permissions</h3>
            <div className="permissions-summary">
              <div className="permission-item">
                <span className="permission-label">Edit Submitted Forms</span>
                <span className={`permission-status ${user.permissions?.forms ? 'granted' : 'denied'}`}>
                  {user.permissions?.forms ? '✓' : '✗'}
                </span>
              </div>
              <div className="permission-item">
                <span className="permission-label">Form Builder</span>
                <span className={`permission-status ${user.permissions?.formBuilder ? 'granted' : 'denied'}`}>
                  {user.permissions?.formBuilder ? '✓' : '✗'}
                </span>
              </div>
              <div className="permission-item">
                <span className="permission-label">Folders</span>
                <span className={`permission-status ${user.permissions?.folders ? 'granted' : 'denied'}`}>
                  {user.permissions?.folders ? '✓' : '✗'}
                </span>
              </div>
              <div className="permission-item">
                <span className="permission-label">Responses</span>
                <span className={`permission-status ${user.permissions?.responses ? 'granted' : 'denied'}`}>
                  {user.permissions?.responses ? '✓' : '✗'}
                </span>
              </div>
              <div className="permission-item">
                <span className="permission-label">Reports</span>
                <span className={`permission-status ${user.permissions?.reports ? 'granted' : 'denied'}`}>
                  {user.permissions?.reports ? '✓' : '✗'}
                </span>
              </div>
              <div className="permission-item">
                <span className="permission-label">Admin Access</span>
                <span className={`permission-status ${user.permissions?.admin ? 'granted' : 'denied'}`}>
                  {user.permissions?.admin ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
          <p className="permission-note">
              Note: Permissions may vary based on your role and account settings. For more access permissions, please contact Smart Factory Worx or your system administrator.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
