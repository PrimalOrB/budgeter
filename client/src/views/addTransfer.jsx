import React, { useState, useEffect } from "react";
import { ActionButton } from "../components/Buttons";
import {
  InlineNumberInput,
  InlineDateInput,
  InlineUserInput,
} from "../components/Forms";
import { InlineError, InlineNotification } from "../components/Notifications";
import { Title } from "../components/Layout";
import { useMutation } from "@apollo/client";
import { CREATE_NEW_TRANSFER } from "../utils/mutations";
import { useStoreContext } from "../utils/GlobalState";

const AddTransferEntry = ({
  categoryType,
  budgetState,
  refetch,
  setPageState,
}) => {
  const [state] = useStoreContext();

  const initialFormState = {
    value: 0,
    createdAt: new Date(),
    userID: state.currentUser._id,
    toUserID: "",
  };

  const [formInput, setFormInput] = useState({ ...initialFormState });

  const [auditState, setAuditState] = useState({ pass: false });

  function audit() {
    const currentAuditState = { ...auditState },
      currentFormState = { ...formInput };

    const auditField = [];

    const numberRequired = ["value", "createdAt"];
    numberRequired.map((field) => {
      const fieldAsNumber = Number(currentFormState[field]),
        isNumber = !isNaN(fieldAsNumber),
        isNotZero = fieldAsNumber !== 0;
      currentAuditState[field] = isNumber && isNotZero;
      auditField.push(currentAuditState[field]);
    });

    const textRequired = ["userID", "toUserID"];
    textRequired.map((field) => {
      currentAuditState[field] = currentFormState[field].length > 0;
      auditField.push(currentAuditState[field]);
    });

    const cannotMatch = ["userID", "toUserID"];
    if (currentFormState[cannotMatch[0]] && currentFormState[cannotMatch[1]]) {
      const entriesMatch =
        currentFormState[cannotMatch[0]] === currentFormState[cannotMatch[1]];
      if (entriesMatch) {
        currentAuditState[cannotMatch[0]] = false;
        currentAuditState[cannotMatch[1]] = false;
        auditField.push(currentAuditState[cannotMatch[0]]);
        auditField.push(currentAuditState[cannotMatch[1]]);
      }
    }

    currentAuditState.pass =
      auditField.filter((x) => x === true).length === auditField.length;

    setAuditState({ ...currentAuditState });
    return;
  }

  useEffect(() => {
    audit();
  }, [formInput]);

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
    useMutation(CREATE_NEW_TRANSFER, {
      variables: {
        input: {
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
    <section className="full-container">
      <Title text={`Add ${categoryType}`} />
      <form autoComplete="off">
        <InlineUserInput
          prop={"userID"}
          input={formInput}
          setInput={setFormInput}
          label={"From User"}
          optionList={budgetState.ownerIDs}
          auditState={auditState}
        />
        <InlineNumberInput
          prop={`value`}
          input={formInput}
          setInput={setFormInput}
          label={"Value"}
          auditState={auditState}
        />
        <InlineDateInput
          prop={`createdAt`}
          input={formInput}
          setInput={setFormInput}
          label={"Transaction Date"}
          auditState={auditState}
        />
        <InlineUserInput
          prop={"toUserID"}
          input={formInput}
          setInput={setFormInput}
          label={"To User"}
          optionList={budgetState.ownerIDs}
          auditState={auditState}
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
          disabled={!auditState.pass}
        />
      )}
    </section>
  );
};

export default AddTransferEntry;
