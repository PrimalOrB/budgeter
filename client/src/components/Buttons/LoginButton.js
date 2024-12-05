import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ActionButton } from ".";

const LoginButton = () => {

  console.log('test 2')
  
  const { loginWithRedirect } = useAuth0( { organization: process.env.ORGID } );

  return (
    <ActionButton additionalClass={ "login" } action={ loginWithRedirect } text={ 'Log In' }/>
  );
};

export default LoginButton;
