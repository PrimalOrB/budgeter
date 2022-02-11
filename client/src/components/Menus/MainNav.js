import {NavLink} from "react-router-dom";
import React from "react";
import { FiHome } from 'react-icons/fi'

const MainNav = () => {

  return (
  <div className="nav-menu">
    <NavLink
      to="/"
      exact
      className="nav-button"
      activeClassName="nav-button-active"
    >
      <FiHome />Dashboard
    </NavLink>
  </div>
  )
};

export default MainNav;
