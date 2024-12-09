import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Auth from '../../utils/auth';
import { ActionButton } from ".";

const LogoutButton = () => {
  
  const { logout } = useAuth0();

  function logoutActions() {
    Auth.logout()
    logout({returnTo: window.location.origin,})
  }

  

  return (
    <ActionButton additionalClass={ "logout" } action={ logoutActions } text={ 'Log Out' }/>
  );
};

export default LogoutButton;
