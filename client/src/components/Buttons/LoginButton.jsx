import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ActionButton } from ".";

const LoginButton = () => {

  console.log(useAuth0( ))
  
  // const { loginWithRedirect } = useAuth0( { organization_name: process.env.ORGID } );
  const { loginWithRedirect } = useAuth0( );

  return (
    <ActionButton additionalClass={ "login" } action={ loginWithRedirect } text={ 'Log In' }/>
  );
};

export default LoginButton;
