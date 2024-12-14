import React, { useState, useEffect } from "react";
import { ActionButton } from "../components/Buttons";
import { InlineTextInput, InlineSelectInput } from "../components/Forms";
import { InlineError, InlineNotification } from "../components/Notifications";
import { useMutation } from "@apollo/client";
import {
  QUERY_BUDGET_CATEGORY,
  UPDATE_BUDGET_CATEGORY,
} from "../utils/mutations";
import { Title } from "../components/Layout";

const EditCategory = ({ refetch, setPageState, editingTransaction }) => {

  const [formInput, setFormInput] = useState({
    budgetID: null,
    title: "",
    categoryType: "",
  });
  const [errorState, setErrorState] = useState();

  const [queryCategory, { loading: queryLoading, error: queryError }] =
    useMutation(QUERY_BUDGET_CATEGORY, {
      variables: {
        input: {
          _id: editingTransaction,
        },
      },
      update: (cache, data) => {
        try {
          if (data.data.queryCategory) {
            let newState = { ...data.data.queryCategory };
            setFormInput({ ...newState });
          }
        } catch (e) {
          console.log(e);
        }
      },
      onError: (err) => {
        setErrorState(err.message);
      },
    });

  useEffect(() => {
    if (editingTransaction) {
      queryCategory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      form.categoryType.length
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
    useMutation(UPDATE_BUDGET_CATEGORY, {
      variables: {
        input: {
          categoryID: editingTransaction,
          title: formInput.title,
        },
      },
      update: (cache, data) => {
        try {
          if (data) {
            refetch();
            return setPageState("dashboard");
          }
        } catch (e) {
          console.error(createdError);
        }
      },
    });

  return (
    <section className="full-container">
      <Title text={`Edit Category`} />
      {errorState ? (
        <InlineError text={errorState} />
      ) : (
        <>
          <form autoComplete="off">
            <InlineSelectInput
              prop={"categoryType"}
              input={formInput}
              setInput={setFormInput}
              label={"Type"}
              optionList={["income", "expense"]}
              disabled
            />
            <InlineTextInput
              prop={"title"}
              input={formInput}
              setInput={setFormInput}
              label={"Category Name"}
            />
            {formInput.error && <InlineError text={formInput.error} />}
          </form>
          {createdLoading ? (
            <InlineNotification text={"Submit processing"} />
          ) : (
            <ActionButton
              action={sumbitForm}
              text={"Submit Edit"}
              additionalClass={"large-button"}
            />
          )}
        </>
      )}
    </section>
  );
};

export default EditCategory;
