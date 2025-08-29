import React from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "./assets/scss/dashlite.scss";
import "./assets/scss/style-email.scss";
import "./css/SyncfusionSpreadsheet.css";

import reportWebVitals from "./reportWebVitals";
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);
//

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
