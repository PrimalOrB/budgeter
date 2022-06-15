import React from "react";
import AuthenticationButton from "../authentication-button";
import { useStoreContext } from "../../utils/GlobalState";

const AuthNav = () => {

    const [ state ] = useStoreContext();
    const { currentUser } = state;

    if( currentUser ){
        const { email } = currentUser;
        return (        
            <div className="nav-menu">
                <span className="username-block noselect">{ email }</span>
                <AuthenticationButton />
            </div>
        )
    }

    return (
        <div className="nav-menu">
            <AuthenticationButton />
        </div>
    )

};

export default AuthNav;
