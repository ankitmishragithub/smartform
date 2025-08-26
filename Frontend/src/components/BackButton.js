import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/BackButton.css';

const BackButton = ({ text = '← Back', className = '', onClick, toHome = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (toHome) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  return (
    <button 
      className={`back-button ${className}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default BackButton;
