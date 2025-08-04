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

const Router = () => {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
       <Route path={`${process.env.PUBLIC_URL}`} element={<Layout />}>
        <Route index element={<Homepage />}></Route>
        
        {/* Form builder routes */}
        <Route path="formBuilder/:id" element={<UnifiedFormBuilder />} />  
        <Route path="formBuilder" element={<UnifiedFormBuilder />} />
        
        {/* Form management routes */}
        <Route path="forms/folders" element={<FolderList />} />
        <Route path="forms/folder/:folderName" element={<FolderFormsView />} />
        <Route path="forms/manage" element={<ManageForms />} />
        <Route path="forms/fill/:id" element={<FormFill />} />
        <Route path="response-details/:responseId" element={<ResponseDetails />} />
        
        {/* Reports routes */}
        <Route path="reports/analytics" element={<FormAnalytics />} />
        <Route path="reports/responses" element={<ResponseReports />} />
        <Route path="reports/folders" element={<FolderReports />} />
           <Route path="reports/submissions" element={<AllSubmissions />} />
        <Route path="reports/export" element={<ExportData />} />
        
        {/* Legacy compatibility */}
        <Route path="view-forms" element={<FormList />} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Error404Modern />}></Route>
      </Route>
    </Routes>
  );
};

export default Router;
