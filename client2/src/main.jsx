// import React from "react";
// import ReactDOM from "react-dom";

import { createRoot } from 'react-dom/client';

import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import Auth0ProviderWithHistory from "./auth/auth0-provider-with-history";

import "./index.css";

// ReactDOM.render(
//   <Router>
//     <Auth0ProviderWithHistory>
//       <App />
//     </Auth0ProviderWithHistory>
//   </Router>,
//   document.getElementById("root")
// );


const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
    <Router>
    <Auth0ProviderWithHistory>
      <App />
    </Auth0ProviderWithHistory>
  </Router>)
