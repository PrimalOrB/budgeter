import React from "react";
import { useNavigate  } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

const Auth0ProviderWithHistory = ({ children }) => {
  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

  const navigate  = useNavigate ();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  const auth0config = {
    domain,
    clientId,
    authorizationParams: {
      audience,
      redirect_uri: window.location.origin,
      // organization: process.env.ORGID
      // scope: REACT_APP_AUTH0_SCOPES,
    }
  }

  console.log( auth0config )

  return (
    <Auth0Provider
    {...auth0config}
      // domain={domain}
      // clientId={clientId}
      // audience={audience}
      // redirect_uri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
      // organization={process.env.ORGID}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
