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

  const initialFormState = {
    categoryID: "--",
    title: "--",
    value: 0,
    createdAt: null,
    userID: "null",
    individualEntry: false,
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [auditState, setAuditState] = useState({ pass: false });
  const [errorState, setErrorState] = useState();
  const [populated, setPopulated] = useState(false);

  const { data: entryData, loading } = useQuery(QUERY_SINGLE_TRANSACTION, {
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

    const textRequired = ["categoryID", "title", "userID"];
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
          <Title
            text={`Edit ${entryData.requestSingleTransaction.valueType}`}
          />
          {errorState ? (
            <InlineError text={errorState} />
          ) : (
            <>
              <form autoComplete="off">
                <InlineSelectInput
                  prop={"categoryID"}
                  input={formInput}
                  setInput={setFormInput}
                  label={"Category"}
                  auditState={auditState}
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
                  prop={"userID"}
                  input={formInput}
                  setInput={setFormInput}
                  label={"User"}
                  optionList={budgetState.ownerIDs}
                  auditState={auditState}
                />
                <InlineSwitchTwoWay
                  prop={`individualEntry`}
                  input={formInput}
                  setInput={setFormInput}
                  label={`${
                    formInput.individualEntry
                      ? "Individual Entry"
                      : "Shared Entry"
                  }`}
                  falseIcon={MdPeople}
                  trueIcon={MdPerson}
                />
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
      )}
    </>
  );
};

export default EditTransactionEntry;
