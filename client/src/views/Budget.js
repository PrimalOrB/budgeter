import React from "react";
import { useParams } from "react-router";

const Budget = () => {

  const { id: _id } = useParams();
    
  return (
    <>
      <p>Budget { _id }</p>
    </>
  )

};

export default Budget;
