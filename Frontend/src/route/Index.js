import React, { useLayoutEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Homepage from "../pages/Homepage";

// Essential form builder pages
import UnifiedFormBuilder from "../pages/UnifiedFormBuilder";
import FormList from "../pages/Formlist";
import FormFill from "../pages/FormFill";
import FolderList from "../pages/FolderList";
import FolderFormsView from "../pages/FolderFormsView";
import ManageForms from "../pages/ManageForms";
import ResponseDetails from "../pages/ResponseDetails";
import ReeditForm from "../pages/ReeditForm";

// Reports pages
import FormAnalytics from "../pages/reports/FormAnalytics";
import ResponseReports from "../pages/reports/ResponseReports";
import ExportData from "../pages/reports/ExportData";
import FolderReports from "../pages/reports/FolderReports";

// Essential layouts
import Layout from "../layout/Index";

// Keep one error page as fallback
import Error404Modern from "../pages/error/404-modern";

// Required imports for ag-grid
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AllSubmissions from "../pages/reports/AllSubmissions";

// Authentication pages
import Login from "../pages/Login";
import AdminPanel from "../pages/AdminPanel";

// Protected Route component
import ProtectedRoute from "../components/ProtectedRoute";

const Router = () => {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path={`${process.env.PUBLIC_URL}`} element={<Layout />}>
        <Route index element={<ProtectedRoute><Homepage /></ProtectedRoute>}></Route>
        
        {/* Form builder routes */}
        <Route path="formBuilder/:id" element={<ProtectedRoute requiredPermission="formBuilder"><UnifiedFormBuilder /></ProtectedRoute>} />  
        <Route path="formBuilder" element={<ProtectedRoute requiredPermission="formBuilder"><UnifiedFormBuilder /></ProtectedRoute>} />
        
        {/* Form management routes */}
        <Route path="forms/folders" element={<ProtectedRoute requiredPermission="folders"><FolderList /></ProtectedRoute>} />
        <Route path="forms/folder/:folderName" element={<ProtectedRoute requiredPermission="folders"><FolderFormsView /></ProtectedRoute>} />
        <Route path="forms/manage" element={<ProtectedRoute requiredPermission="folders"><ManageForms /></ProtectedRoute>} />
        <Route path="forms/fill/:id" element={<ProtectedRoute requiredPermission="folders"><FormFill /></ProtectedRoute>} />
        <Route path="response-details/:responseId" element={<ProtectedRoute requiredPermission="responses"><ResponseDetails /></ProtectedRoute>} />
        <Route path="response-details/:responseId/edit" element={<ProtectedRoute requiredPermission="responses"><ResponseDetails /></ProtectedRoute>} />
        <Route path="forms/reedit/:formId/:responseId" element={<ProtectedRoute requiredPermission="responses"><ReeditForm /></ProtectedRoute>} />
        
        {/* Reports routes */}
        <Route path="reports/analytics" element={<ProtectedRoute requiredPermission="reports"><FormAnalytics /></ProtectedRoute>} />
        <Route path="reports/responses" element={<ProtectedRoute requiredPermission="reports"><ResponseReports /></ProtectedRoute>} />
        <Route path="reports/folders" element={<ProtectedRoute requiredPermission="reports"><FolderReports /></ProtectedRoute>} />
        <Route path="reports/submissions" element={<ProtectedRoute requiredPermission="reports"><AllSubmissions /></ProtectedRoute>} />
        <Route path="reports/export" element={<ProtectedRoute requiredPermission="reports"><ExportData /></ProtectedRoute>} />
        
        {/* Admin routes */}
        <Route path="admin" element={<ProtectedRoute requiredPermission="admin"><AdminPanel /></ProtectedRoute>} />
        
        {/* Legacy compatibility */}
        <Route path="view-forms" element={<ProtectedRoute requiredPermission="folders"><FormList /></ProtectedRoute>} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Error404Modern />}></Route>
      </Route>
    </Routes>
  );
};

export default Router;
