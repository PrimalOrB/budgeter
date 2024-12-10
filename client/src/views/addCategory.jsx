import React, { useState } from "react";
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

  function validateForm(form) {
    if (
      form.title === undefined ||
      form.budgetID === undefined ||
      form.categoryType === undefined
    ) {
      return false;
    }
    if (
      form.title.length > 0 &&
      form.budgetID.length > 0 &&
      form.categoryType.length > 0
    ) {
      return true;
    }
    return false;
  }

  function sumbitForm() {
    // check form validity
    const valid = validateForm(formInput);

    // if is valid, procees
    if (valid) {
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
          optionList={["income", "expense"]}
        />
        <InlineTextInput
          prop={"title"}
          input={formInput}
          setInput={setFormInput}
          label={"Category Name"}
        />
      </form>
      {createdLoading ? (
        <InlineNotification text={"Submit processing"} />
      ) : (
        <ActionButton
          action={sumbitForm}
          text={"Submit"}
          additionalClass={"large-button"}
        />
      )}
    </section>
  );
};

export default AddCategory;
