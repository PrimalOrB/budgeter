import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useStoreContext } from "../utils/GlobalState";
import { ActionButton } from "../components/Buttons";
import {
  InlineNumberInput,
  InlineDateInput,
  InlineUserInput,
} from "../components/Forms";
import { InlineError, InlineNotification } from "../components/Notifications";
import { Title } from "../components/Layout";
import { useMutation } from "@apollo/client";
import { EDIT_TRANSFER } from "../utils/mutations";
import { QUERY_SINGLE_TRANSFER } from "../utils/queries";
import { FullPageSpinLoader } from "../components";

const EditTransferEntry = ({
  budgetState,
  refetch,
  editingID,
  setPageState,
}) => {
  const { id: _id } = useParams();

  const [state] = useStoreContext();
  const { currentUser } = state;

  const { data: entryData, loading } = useQuery(QUERY_SINGLE_TRANSFER, {
    variables: {
      entryID: editingID,
      budgetID: _id,
      userID: currentUser._id,
    },
  });

  const initialFormState = {
    value: 0,
    createdAt: null,
    userID: null,
    toUserID: null,
  };

  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [populated, setPopulated] = useState(false);

  useEffect(() => {
    if (entryData?.requestSingleTransfer) {
      console.log(entryData)
      const { value, createdAt, toUserID, userID } = entryData.requestSingleTransfer;
      setFormInput({
        value,
        createdAt,
        userID: userID._id,
        toUserID: toUserID._id,
      });
      setPopulated(true);
    }
  }, [entryData]);


  function validateForm(form) {
    if (
      form.value === undefined ||
      form.userID === form.toUserID ||
      form.userID === "" ||
      form.toUserID === ""
    ) {
      return false;
    }
    if (
      form.value !== 0 &&
      form.userID !== form.toUserID &&
      form.userID !== "" &&
      form.toUserID !== ""
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
    useMutation(EDIT_TRANSFER, {
      variables: {
        input: {
          entryID: editingID,
          value: formInput.value,
          budgetID: budgetState._id,
          createdAt: formInput.createdAt,
          userID: formInput.userID,
          toUserID: formInput.toUserID,
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
          <Title text={`Edit Transfer`} />
          <form autoComplete="off">
            <InlineUserInput
              prop={"userID"}
              input={formInput}
              setInput={setFormInput}
              label={"From User"}
              optionList={budgetState.ownerIDs}
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
              prop={"toUserID"}
              input={formInput}
              setInput={setFormInput}
              label={"To User"}
              optionList={budgetState.ownerIDs}
            />
            {formInput.error && <InlineError text={formInput.error} />}
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
      )}
    </>
  );
};

export default EditTransferEntry;
