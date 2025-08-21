import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import '../css/AdminPanel.css';

const AdminPanel = () => {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    permissions: {
      forms: false,
      formBuilder: false,
      folders: false,
      responses: false,
      reports: false,
      admin: false
    }
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permissions.')) {
      const permission = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/auth/users/${editingUser._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEditingUser(null);
      } else {
        // Create new user
        await api.post('/auth/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Reset form and refresh users
      resetForm();
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      permissions: { ...user.permissions }
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/auth/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (error) {
        setError('Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/auth/users/${userId}`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      setError('Failed to update user status');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
      permissions: {
        forms: false,
        formBuilder: false,
        folders: false,
        responses: false,
        reports: false,
        admin: false
      }
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  if (!isAdmin()) {
    return <div className="admin-access-denied">Access denied. Admin only.</div>;
  }

  if (loading && users.length === 0) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button 
          className="admin-create-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="admin-form-container">
          <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {!editingUser && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="permissions-section">
              <label>Permissions</label>
              <div className="permissions-grid">
                <label className="permission-item">
                  <input
                    type="checkbox"
                    name="permissions.forms"
                    checked={formData.permissions.forms}
                    onChange={handleInputChange}
                  />
                  Forms Access
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    name="permissions.formBuilder"
                    checked={formData.permissions.formBuilder}
                    onChange={handleInputChange}
                  />
                  Form Builder
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    name="permissions.folders"
                    checked={formData.permissions.folders}
                    onChange={handleInputChange}
                  />
                  Forms/Folders
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    name="permissions.responses"
                    checked={formData.permissions.responses}
                    onChange={handleInputChange}
                  />
                  Responses Access
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    name="permissions.reports"
                    checked={formData.permissions.reports}
                    onChange={handleInputChange}
                  />
                  Reports Access
                </label>
                <label className="permission-item">
                  <input
                    type="checkbox"
                    name="permissions.admin"
                    checked={formData.permissions.admin}
                    onChange={handleInputChange}
                  />
                  Admin Access
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="admin-submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
              </button>
              {editingUser && (
                <button type="button" className="admin-cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="admin-users">
        <h2>User Management</h2>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="permissions-list">
                      {Object.entries(user.permissions).map(([key, value]) => (
                        value && (
                          <span key={key} className="permission-badge">
                            {key}
                          </span>
                        )
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn toggle-btn"
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(user._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
