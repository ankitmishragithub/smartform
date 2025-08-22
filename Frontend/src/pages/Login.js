import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../css/Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>
      
      <div className="login-content">
        <div className="left-panel">
          <div className="brand-section">
            <div className="logo-container">
              <img src="/static/media/logo2x.73dbadf7ac60fa03d03b.jpeg" alt="Smart Factory Worx Logo" className="main-logo" />
            </div>
            <h1 className="brand-title">Smart Factory Worx</h1>
            <h2 className="brand-subtitle">Advanced Form Management System</h2>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <span>Form Builder</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <span>Secure Data Management</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📈</div>
                <span>Real-time Analytics</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span>Smart Automation</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="right-panel">
          <div className="login-card">
            <div className="login-header">
              <h3>Welcome Back</h3>
              <p>Access your smart form management dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="username">
                  <div className="label-icon">👤</div>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your username"
                  className="smart-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <div className="label-icon">🔐</div>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="smart-input"
                />
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                <span className="button-text">
                  {loading ? 'Authenticating...' : 'Sign In'}
                </span>
                <div className="button-icon">
                  {loading ? '⏳' : '🚀'}
                </div>
              </button>
            </form>
            
            <div className="login-footer">
              <p>Powered by Smart Factory Worx</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
