import React, { useEffect } from "react";
import { UPDATE_USER } from '../../utils/actions';
import { AuthNav, MainNav } from "../Menus";
import { useStoreContext } from "../../utils/GlobalState";
import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from '@apollo/client';
import { LOGIN_USER } from '../../utils/mutations'
import Auth from '../../utils/auth';

const Header = () => {

  const [, dispatch] = useStoreContext();

  const [login, { error }] = useMutation(LOGIN_USER);

  // add user to global state
  const { user, getAccessTokenSilently, getIdTokenClaims } = useAuth0()
  useEffect(() => {
    if (user) {
      tryLogin()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ user ]);


  // the server verifies the Auth0 ID token and reads the email from it
  const tryLogin = async ()  => {
    try {
      try {
        // renews the Auth0 session so the ID token isn't expired
        await getAccessTokenSilently()
      } catch (e) {
        console.warn('Could not refresh Auth0 session', e)
      }
      const claims = await getIdTokenClaims()
      const { data } = await login({
        variables: { idToken: claims?.__raw || '' }
      } );
      Auth.login(data.login.token);
      const userID = Auth.getProfile( data.login.token )
      dispatch({
        type: UPDATE_USER,
        currentUser: { email: userID.data.email, _id: userID.data._id}
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <MainNav />
          <AuthNav />
        </div>
      </header>
      { error &&
        <div className="banner banner-error" role="alert">
          Could not sign in to the budget server. Try refreshing the page.
        </div>
      }
    </>
  );
};

export default Header;
