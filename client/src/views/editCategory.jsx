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

  const [populated, setPopulated] = useState(false);

  const [auditState, setAuditState] = useState({ pass: false });

  function audit() {
    const currentAuditState = { ...auditState },
      currentFormState = { ...formInput };

    const auditField = [];

    const textRequired = ["budgetID", "title", "categoryType"];
    textRequired.map((field) => {
      currentAuditState[field] = currentFormState[field].length > 0;
      auditField.push(currentAuditState[field]);
    });

    currentAuditState.pass =
      auditField.filter((x) => x === true).length === auditField.length;

    setAuditState({ ...currentAuditState });
    return;
  }

  useEffect(() => {
    if (populated) {
      audit();
    }
  }, [formInput]);

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
            setPopulated(true);
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
            {formInput.error && <InlineError text={formInput.error} />}
          </form>
          {createdLoading ? (
            <InlineNotification text={"Submit processing"} />
          ) : (
            <ActionButton
              action={sumbitForm}
              text={"Submit Edit"}
              additionalClass={"large-button"}
              disabled={!auditState.pass}
            />
          )}
        </>
      )}
    </section>
  );
};

export default EditCategory;
