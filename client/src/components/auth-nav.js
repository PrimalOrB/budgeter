import React from "react";
import AuthenticationButton from "./authentication-button";
import { useStoreContext } from "../utils/GlobalState";

const AuthNav = () => {

    const [state] = useStoreContext();
    const { currentUser } = state;

    if( currentUser ){
        const { given_name, picture } = currentUser;
        return (
        
            <div className="access-block">
                <div className="profile-img">
                    <img
                        src={picture}
                        alt="Profile"
                    />
                </div>
                <h2>{given_name}</h2>
                <AuthenticationButton />
            </div>
        )
    }

    return (
            <div className="access-block">
                <AuthenticationButton />
            </div>
    )

};

export default AuthNav;
