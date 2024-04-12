import React from "react";
import { NavLink } from "react-router-dom";

const LinkButton = ( { to, icon, text} ) => (
  <NavLink to={ to } exact="true" className="nav-button noselect" activeclassname="nav-button-active">{ icon() }{ text }</NavLink>
);

export default LinkButton;
