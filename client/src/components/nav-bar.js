import React, { useEffect } from "react";
import { UPDATE_USER} from '../utils/actions';
import MainNav from "./main-nav";
import AuthNav from "./auth-nav";
import { useStoreContext } from "../utils/GlobalState";
import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from '@apollo/client';
import { LOGIN_USER } from '../utils/mutations'
import Auth from '../utils/auth';
import { Loading } from ".";

const NavBar = () => {

  const [, dispatch] = useStoreContext();

  const [login, { error }] = useMutation(LOGIN_USER);

  // add user to global state
  const { user } = useAuth0()
  useEffect(() => {
    if (user) {
      dispatch({
        type: UPDATE_USER,
        currentUser: user
      });
      tryLogin()
    }
  }, [user, dispatch]);


  const tryLogin = async ()  => {
    try {
      const { data } = await login({
        variables: {email: user.email }
      });
      Auth.login(data.login.token);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
    { error ? <Loading /> :
      <nav>
        <div className="container">
          <MainNav />
          <AuthNav />
        </div>
      </nav>
    }
    </>
  );
};

export default NavBar;
