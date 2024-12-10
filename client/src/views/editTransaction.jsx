import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { ActionButton } from "../components/Buttons";
import { useStoreContext } from "../utils/GlobalState";
import {
  InlineSelectInput,
  InlineTextareaInput,
  InlineNumberInput,
  InlineDateInput,
  InlineUserInput,
  InlineSwitchTwoWay,
} from "../components/Forms";
import { FullPageSpinLoader } from "../components";
import { InlineError, InlineNotification } from "../components/Notifications";
import { Title } from "../components/Layout";
import { useMutation } from "@apollo/client";
import { EDIT_TRANSACTION } from "../utils/mutations";
import { QUERY_SINGLE_TRANSACTION } from "../utils/queries";
import { MdPerson, MdPeople } from "react-icons/md";

const EditTransactionEntry = ({
  budgetState,
  refetch,
  editingID,
  setPageState,
}) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;

  const { data: entryData, loading } = useQuery(QUERY_SINGLE_TRANSACTION, {
    variables: { entryID: editingID, budgetID: _id, userID: currentUser._id },
  });

  const initialFormState = {
    categoryID: "--",
    title: "--",
    value: 0,
    createdAt: null,
    userID: null,
    individualEntry: false,
  };

  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [populated, setPopulated] = useState(false);

  useEffect(() => {
    if (entryData?.requestSingleTransaction) {
      const { categoryID, title, value, createdAt, userID, individualEntry } =
        entryData.requestSingleTransaction;
      setFormInput({
        categoryID,
        title,
        value,
        createdAt,
        userID: userID._id,
        individualEntry,
      });
      setPopulated(true);
    }
  }, [entryData]);

  function validateForm(form) {
    if (
      form.categoryID === undefined ||
      form.title === undefined ||
      form.value === undefined
    ) {
      return false;
    }
    if (
      form.categoryID.length > 0 &&
      form.title.length > 0 &&
      form.value !== 0
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
    useMutation(EDIT_TRANSACTION, {
      variables: {
        input: {
          entryID: editingID,
          title: formInput.title,
          value: formInput.value,
          budgetID: budgetState._id,
          categoryID: formInput.categoryID,
          createdAt: formInput.createdAt,
          userID: formInput.userID,
          individualEntry: formInput.individualEntry,
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
    <>
      {loading || !populated ? (
        <section className="full-container">
          <FullPageSpinLoader />
        </section>
      ) : (
        <section className="full-container">
          <Title
            text={`Edit ${entryData.requestSingleTransaction.valueType}`}
          />
          <form autoComplete="off">
            <InlineSelectInput
              prop={"categoryID"}
              input={formInput}
              setInput={setFormInput}
              label={"Category"}
              optionList={budgetState.categories.filter(
                (category) =>
                  category.categoryType ===
                  entryData.requestSingleTransaction.valueType
              )}
            />
            <InlineTextareaInput
              prop={"title"}
              input={formInput}
              setInput={setFormInput}
              label={"Description"}
            />
            <InlineNumberInput
              prop={`value`}
              input={formInput}
              setInput={setFormInput}
              label={"Value"}
            />
            <InlineDateInput
              prop={`createdAt`}
              input={formInput}
              setInput={setFormInput}
              label={"Transaction Date"}
            />
            <InlineUserInput
              prop={"userID"}
              input={formInput}
              setInput={setFormInput}
              label={"User"}
              optionList={budgetState.ownerIDs}
            />
            <InlineSwitchTwoWay
              prop={`individualEntry`}
              input={formInput}
              setInput={setFormInput}
              label={`${
                formInput.individualEntry ? "Individual Entry" : "Shared Entry"
              }`}
              falseIcon={MdPeople}
              trueIcon={MdPerson}
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
        </section>
      )}
    </>
  );
};

export default EditTransactionEntry;
