import { useState, useCallback } from 'react';
import api from '../api/api';

/**
 * Custom hook for form API operations
 * Centralizes all form-related API calls
 */
export const useFormAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create new form
  const createForm = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/forms', formData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create form';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all forms
  const getForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/forms');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load forms';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all unique folder names
  const getFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/forms/folders');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load folders';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get forms by folder name
  const getFormsByFolder = useCallback(async (folderName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/forms/folder/${encodeURIComponent(folderName)}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load forms for folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single form by ID
  const getForm = useCallback(async (formId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/forms/${formId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load form';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update form
  const updateForm = useCallback(async (formId, formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/forms/${formId}`, formData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update form';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete form
  const deleteForm = useCallback(async (formId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/forms/${formId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete form';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit form response
  const submitResponse = useCallback(async (responseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/responses', responseData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to submit response';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get form responses (admin only)
  const getFormResponses = useCallback(async (formId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/responses/form/${formId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load responses';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    createForm,
    getForms,
    getFolders,
    getFormsByFolder,
    getForm,
    updateForm,
    deleteForm,
    submitResponse,
    getFormResponses,
    clearError
  };
}; 