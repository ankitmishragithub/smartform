// src/pages/FormList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Button, Spinner } from 'reactstrap';

export default function FormList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/forms')
      .then(res => setForms(res.data))
      .catch(() => setError('Failed to load forms.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner /></div>;
  if (error)   return <p className="text-danger">{error}</p>;

  return (
    <div className="p-4">
      <h2>Your Saved Forms</h2>
      {forms.map(f => (
        <div key={f._id} className="my-3 d-flex align-items-center">
          <span>Form ID: {f._id}</span>
          <Button
            color="primary"
            size="sm"
            className="ml-2"
            onClick={() => navigate(`/fill/${f._id}`)}
          >
            Fill Form
          </Button>
        </div>
      ))}
    </div>
  );
}
