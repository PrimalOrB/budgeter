import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Auth from '../utils/auth';

const LogoutButton = () => {
  const { logout } = useAuth0();
  return (
    <button
      onClick={() =>
        {
          // remove token
          Auth.logout()
          // auth0 logout
          logout({
          returnTo: window.location.origin,
        })
        }
      }
    >
      Log Out
    </button>
  );
};

export default LogoutButton;
