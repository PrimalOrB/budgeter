import React, { useEffect } from "react";
import { UPDATE_USER } from '../../utils/actions';
import { AuthNav, MainNav } from "../Menus";
import { useStoreContext } from "../../utils/GlobalState";
import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from '@apollo/client';
import { LOGIN_USER } from '../../utils/mutations'
import Auth from '../../utils/auth';
import { SpinLoader } from '../'

const Header = () => {

  const [, dispatch] = useStoreContext();

  const [login, { error }] = useMutation(LOGIN_USER);

  // add user to global state
  const { user } = useAuth0()
  useEffect(() => {
    if (user) {
      tryLogin()
    }
  }, [ user ]);


  const tryLogin = async ()  => {
    try {
      const { data } = await login({
        variables: { email: user.email }
      } );
      const userID = Auth.getProfile( data.login.token )
      dispatch({
        type: UPDATE_USER,
        currentUser: { email: userID.data.email, _id: userID.data._id}
      });
      Auth.login(data.login.token);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
    { error ? <SpinLoader /> :
      <header>
        <div className="header-container">
          <MainNav />
          <AuthNav />
        </div>
      </header>
    }
    </>
  );
};

export default Header;
