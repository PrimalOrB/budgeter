import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ActionButton } from ".";

const LoginButton = () => {

  const { loginWithRedirect } = useAuth0();
  
  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/",
      },
    });
  };

  return (
    <ActionButton
      additionalClass={"login"}
      action={handleLogin}
      text={"Log In"}
    />
  );
};

export default LoginButton;
