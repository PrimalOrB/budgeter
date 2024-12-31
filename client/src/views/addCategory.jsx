import React, { useState, useEffect } from "react";
import { ActionButton } from "../components/Buttons";
import { InlineTextInput, InlineSelectInput } from "../components/Forms";
import { InlineNotification } from "../components/Notifications";
import { useMutation } from "@apollo/client";
import { CREATE_NEW_BUDGET_CATEGORY } from "../utils/mutations";
import { Title } from "../components/Layout";

const AddCategory = ({ id , refetch, setPageState}) => {
  const [formInput, setFormInput] = useState({
    budgetID: id,
    title: "",
    categoryType: "",
  });

   const [auditState, setAuditState] = useState({ pass: false });
  
    function audit(){
      const currentAuditState = { ...auditState },
      currentFormState = { ...formInput };
  
      const auditField = [];
  
      const textRequired = ["budgetID","title","categoryType"];
      textRequired.map((field) => {
        currentAuditState[field] = currentFormState[field].length > 0;
        auditField.push(currentAuditState[field]);
      });
  
      currentAuditState.pass =
        auditField.filter((x) => x === true).length === auditField.length;
  
      setAuditState({ ...currentAuditState });
      return;
    }
  
    useEffect(()=>{
      audit()
    },[formInput])

  function sumbitForm() {
    // if is valid, procees
    if (auditState.pass) {
      setFormInput({
        ...formInput,
        error: null,
      });

      // send to submit
      return processSumbit();
    }
    // return error
    setFormInput({
      ...formInput,
      error: "Failed form validation",
    });
    return console.log("failed");
  }

  const [processSumbit, { loading: createdLoading, error: createdError }] =
    useMutation(CREATE_NEW_BUDGET_CATEGORY, {
      variables: {
        input: {
          budgetID: formInput.budgetID,
          categoryType: formInput.categoryType,
          title: formInput.title,
        },
      },
      update: (cache, data) => {
        try {
          if (data) {
            refetch()
          return setPageState( 'dashboard' )
          }
        } catch (e) {
          console.error(createdError);
        }
      },
    });

  return (
    <section className="full-container">
      <Title text={`Create New Category`} />
      <form autoComplete="off">
        <InlineSelectInput
          prop={"categoryType"}
          input={formInput}
          setInput={setFormInput}
          label={"Type"}
          auditState={auditState}
          optionList={["income", "expense"]}
        />
        <InlineTextInput
          prop={"title"}
          input={formInput}
          setInput={setFormInput}
          label={"Category Name"}
          auditState={auditState}
        />
      </form>
      {createdLoading ? (
        <InlineNotification text={"Submit processing"} />
      ) : (
        <ActionButton
          action={sumbitForm}
          text={"Submit"}
          additionalClass={"large-button"}
          disabled={!auditState.pass}
        />
      )}
    </section>
  );
};

export default AddCategory;
