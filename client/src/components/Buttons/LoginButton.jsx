import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FiLogIn } from "react-icons/fi";
import { ActionButton } from ".";

const LoginButton = ({ additionalClass = "btn-primary btn-sm" }) => {

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
      additionalClass={additionalClass}
      action={handleLogin}
      icon={FiLogIn}
      text={"Log In"}
    />
  );
};

export default LoginButton;
