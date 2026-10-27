import React from "react";

const InlineError = ( { text} ) => (
  <div className={ 'banner banner-error' } role="alert">{ text }</div>
);

export default InlineError;
