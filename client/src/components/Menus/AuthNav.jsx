import React from "react";
import AuthenticationButton from "../authentication-button";
import ThemeToggle from "./ThemeToggle";
import { useStoreContext } from "../../utils/GlobalState";

const AuthNav = () => {

    const [ state ] = useStoreContext();
    const { email } = state.currentUser || {};

    return (
        <div className="nav-menu">
            <ThemeToggle />
            { email &&
                <span className="username-block noselect" title={ email }>
                    <span className="username-avatar" aria-hidden="true">{ email[0].toUpperCase() }</span>
                    <span className="username-email mobile-hide">{ email }</span>
                </span>
            }
            <AuthenticationButton />
        </div>
    )

};

export default AuthNav;
