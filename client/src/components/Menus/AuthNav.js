import React from "react";
import AuthenticationButton from "../authentication-button";
import { useStoreContext } from "../../utils/GlobalState";

const AuthNav = () => {

    const [state] = useStoreContext();
    const { currentUser } = state;

    if( currentUser ){
        const { name } = currentUser;
        return (
        
            <div className="nav-menu">
                <span className="username-block">{ name }</span>
                <AuthenticationButton />
            </div>
        )
    }

    return (
        <AuthenticationButton />
    )

};

export default AuthNav;
