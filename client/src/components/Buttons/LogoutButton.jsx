import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FiLogOut } from "react-icons/fi";
import Auth from '../../utils/auth';

const LogoutButton = () => {
  
  const { logout } = useAuth0();

  function logoutActions() {
    // clear the server token, then let Auth0 end its session and redirect
    Auth.clearToken()
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <button type="button" className="icon-button" onClick={ logoutActions } title="Log out" aria-label="Log out">
      <FiLogOut />
    </button>
  );
};

export default LogoutButton;
