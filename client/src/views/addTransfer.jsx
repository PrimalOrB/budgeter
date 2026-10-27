import React, { useState, useEffect } from "react";
import { ActionButton } from "../components/Buttons";
import {
  InlineTextareaInput,
  InlineNumberInput,
  InlineDateInput,
  InlineUserInput,
} from "../components/Forms";
import { InlineError, InlineNotification } from "../components/Notifications";
import { Title } from "../components/Layout";
import { useMutation } from "@apollo/client";
import { CREATE_NEW_TRANSFER } from "../utils/mutations";
import { useStoreContext } from "../utils/GlobalState";
import { toEffectiveDate } from "../utils/helpers";

const AddTransferEntry = ({
  categoryType,
  budgetState,
  refetch,
  setPageState,
}) => {
  const [state] = useStoreContext();

  const initialFormState = {
    value: 0,
    effectiveDate: toEffectiveDate(new Date()),
    userID: state.currentUser._id,
    toUserID: "",
    note: "",
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [auditState, setAuditState] = useState({ pass: false });
  const [errorState, setErrorState] = useState();

  function audit() {
    const currentAuditState = { ...auditState },
      currentFormState = { ...formInput };

    const auditField = [];

    const numberRequired = ["value", "effectiveDate"];
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
      });

      // send to submit
      return processSumbit();
    }
    return;
  }

  const [processSumbit, { loading: createdLoading }] = useMutation(
    CREATE_NEW_TRANSFER,
    {
      variables: {
        input: {
          value: formInput.value,
          budgetID: budgetState._id,
          effectiveDate: formInput.effectiveDate,
          userID: formInput.userID,
          toUserID: formInput.toUserID,
          note: formInput.note,
        },
      },
      update: (cache, data) => {
        try {
          if (data) {
            refetch();
            return setPageState("dashboard");
          }
        } catch (e) {
          setErrorState(err.message);
        }
      },
      onError: (err) => {
        setErrorState(err.message);
      },
    }
  );

  return (
    <section className="full-container">
      <Title text={`Add ${categoryType}`} />
      {errorState ? (
        <InlineError text={errorState} />
      ) : (
        <>
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
              prop={`effectiveDate`}
              input={formInput}
              setInput={setFormInput}
              label={"Effective date"}
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
            <InlineTextareaInput
              prop={"note"}
              input={formInput}
              setInput={setFormInput}
              label={"Note"}
              placeholder={"Optional — what was this transfer for?"}
              rows={2}
              auditState={{ note: true }}
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
        </>
      )}
    </section>
  );
};

export default AddTransferEntry;
