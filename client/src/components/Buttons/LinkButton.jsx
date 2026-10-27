import React from "react";
import { NavLink } from "react-router-dom";

const LinkButton = ( { to, icon, text} ) => (
  <NavLink
    to={ to }
    end
    className={ ( { isActive } ) => `nav-link noselect${ isActive ? ' nav-link-active' : '' }` }
  >
    { icon() }<span className="mobile-hide">{ text }</span>
  </NavLink>
);

export default LinkButton;
