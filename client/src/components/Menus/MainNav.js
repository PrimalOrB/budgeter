import React from "react";
import { FiHome } from 'react-icons/fi'
import { LinkButton } from "../Buttons";

const MainNav = () => {

  return (
  <div className="nav-menu">
    <LinkButton to="/" icon={ FiHome } text={ "Dashboard" } />
    <LinkButton to="/test" icon={ FiHome } text={ "Test" } />
  </div>
  )
};

export default MainNav;
