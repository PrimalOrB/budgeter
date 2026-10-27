import React from "react";

const InlineNotification = ( { text} ) => (
  <div className={ 'banner banner-info' } role="status">
    <span className="spinner spinner-sm" aria-hidden="true" />
    { text }
  </div>
);

export default InlineNotification;
