import React, { useState, useEffect } from "react";
import { ActionButton } from "../components/Buttons";
import {
  InlineSelectInput,
  InlineTextareaInput,
  InlineNumberInput,
  InlineDateInput,
  InlineUserInput,
  InlineSwitchTwoWay,
  FuelDetailsInput,
  emptyFuel,
  fuelForSubmit,
} from "../components/Forms";
import { InlineError, InlineNotification } from "../components/Notifications";
import { Title } from "../components/Layout";
import { useMutation } from "@apollo/client";
import { CREATE_NEW_TRANSACTION } from "../utils/mutations";
import { useStoreContext } from "../utils/GlobalState";
import { toEffectiveDate } from "../utils/helpers";
import { MdPerson, MdPeople } from "react-icons/md";

const AddTransactionEntry = ({
  categoryType,
  budgetState,
  refetch,
  setPageState,
}) => {
  const [state] = useStoreContext();

  const initialFormState = {
    categoryID: "",
    title: "",
    value: 0,
    effectiveDate: toEffectiveDate(new Date()),
    userID: state.currentUser._id,
    individualEntry: false,
    fuel: emptyFuel,
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  // categories that track mileage offer optional fuel details
  const tracksMileage =
    budgetState.categories.find((c) => c._id === formInput.categoryID)?.metaType ===
    "mileage";
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

  const [processSumbit, { loading: createdLoading }] =
    useMutation(CREATE_NEW_TRANSACTION, {
      variables: {
        input: {
          title: formInput.title,
          value: formInput.value,
          budgetID: budgetState._id,
          categoryID: formInput.categoryID,
          effectiveDate: formInput.effectiveDate,
          userID: formInput.userID,
          individualEntry: formInput.individualEntry,
          mileage: tracksMileage ? fuelForSubmit(formInput.fuel) : null,
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
    <section className="full-container">
      <Title text={`Add ${categoryType}`} />
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
              optionList={budgetState.categories
                .filter((category) => category.categoryType === categoryType)
                .sort((a, b) => (b.countUse || 0) - (a.countUse || 0))}
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
            {tracksMileage && (
              <FuelDetailsInput
                input={formInput}
                setInput={setFormInput}
                vehicles={budgetState.vehicles}
              />
            )}
            <InlineDateInput
              prop={`effectiveDate`}
              input={formInput}
              setInput={setFormInput}
              label={"Effective date"}
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
              label={"Split"}
              falseIcon={MdPeople}
              trueIcon={MdPerson}
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
        </>
      )}
    </section>
  );
};

export default AddTransactionEntry;
