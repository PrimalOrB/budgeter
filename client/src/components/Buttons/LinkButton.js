import React from "react";
import { NavLink } from "react-router-dom";

const LinkButton = ( { to, icon, text} ) => (
  <NavLink to={ to } exact className="nav-button" activeClassName="nav-button-active">{ icon() }{ text }</NavLink>
);

export default LinkButton;
