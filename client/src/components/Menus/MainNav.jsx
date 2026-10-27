import React from "react";
import { Link } from "react-router-dom";
import { FiHome } from 'react-icons/fi'
import { LinkButton } from "../Buttons";

const MainNav = () => {

  return (
  <div className="nav-menu">
    <Link to="/" className="brand noselect">
      <span className="brand-mark" aria-hidden="true">B</span>
      <span className="brand-name">Budgeter</span>
    </Link>
    <LinkButton to="/" icon={ FiHome } text={ "Dashboard" } />
  </div>
  )
};

export default MainNav;
