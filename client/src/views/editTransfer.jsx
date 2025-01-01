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

  const initialFormState = {
    value: 0,
    createdAt: null,
    userID: null,
    toUserID: null,
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [auditState, setAuditState] = useState({ pass: false });
  const [errorState, setErrorState] = useState();
  const [populated, setPopulated] = useState(false);

  const { data: entryData, loading } = useQuery(QUERY_SINGLE_TRANSFER, {
    variables: {
      entryID: editingID,
      budgetID: _id,
      userID: currentUser._id,
    },
    onError: (err) => {
      setErrorState(err.message);
    },
  });

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
    if (populated) {
      audit();
    }
  }, [formInput]);

  useEffect(() => {
    if (entryData?.requestSingleTransfer) {
      const { value, createdAt, toUserID, userID } =
        entryData.requestSingleTransfer;
      setFormInput({
        value,
        createdAt,
        userID: userID._id,
        toUserID: toUserID._id,
      });
      setPopulated(true);
    }
  }, [entryData]);

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

  const [processSumbit, { loading: createdLoading }] =
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
          setErrorState(err.message);
        }
      },
      onError: (err) => {
        setErrorState(err.message);
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
                  auditState={auditState}
                  optionList={budgetState.ownerIDs}
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
                  auditState={auditState}
                  optionList={budgetState.ownerIDs}
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
      )}
    </>
  );
};

export default EditTransferEntry;
