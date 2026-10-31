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
  FuelDetailsInput,
  emptyFuel,
  fuelFromEntry,
  fuelForSubmit,
  maintenanceFromEntry,
  tiresFromEntry,
  MaintenanceDetailsInput,
  emptyMaintenance,
  maintenanceForSubmit,
  TireChangeInput,
  emptyTires,
  tiresForSubmit,
  fuelReady,
  maintenanceReady,
} from "../components/Forms";
import { FullPageSpinLoader } from "../components";
import { InlineError, InlineNotification } from "../components/Notifications";
import { Title, EntryTimestamps } from "../components/Layout";
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
    effectiveDate: null,
    userID: "null",
    individualEntry: false,
    fuel: emptyFuel,
    service: emptyMaintenance,
    tires: emptyTires,
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  // categories that track mileage or maintenance offer optional vehicle details
  const metaType = budgetState.categories.find((c) => c._id === formInput.categoryID)?.metaType;
  const tracksMileage = metaType === "mileage";
  const tracksMaintenance = metaType === "maintenance";
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

    // vehicle details, when switched on, need every number valid
    if (tracksMileage) {
      auditField.push(fuelReady(currentFormState.fuel));
    }
    if (tracksMaintenance) {
      auditField.push(maintenanceReady(currentFormState.service));
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
    if (entryData?.requestSingleTransaction) {
      const { categoryID, title, value, effectiveDate, userID, individualEntry, mileage, maintenance, tireChange } =
        entryData.requestSingleTransaction;
      setFormInput({
        categoryID,
        title,
        value,
        effectiveDate,
        userID: userID._id,
        individualEntry,
        fuel: fuelFromEntry(mileage),
        service: maintenanceFromEntry(maintenance),
        tires: tiresFromEntry(tireChange),
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
          effectiveDate: formInput.effectiveDate,
          userID: formInput.userID,
          individualEntry: formInput.individualEntry,
          mileage: tracksMileage ? fuelForSubmit(formInput.fuel) : null,
          maintenance: tracksMaintenance ? maintenanceForSubmit(formInput.service) : null,
          // a tire change rides on the maintenance details
          tireChange:
            tracksMaintenance && maintenanceForSubmit(formInput.service)
              ? tiresForSubmit(formInput.tires)
              : null,
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
          <EntryTimestamps entry={entryData.requestSingleTransaction} />
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
                    .filter(
                      (category) =>
                        category.categoryType ===
                        entryData.requestSingleTransaction.valueType
                    )
                    // most used first, as when adding
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
                {tracksMaintenance && (
                  <MaintenanceDetailsInput
                    input={formInput}
                    setInput={setFormInput}
                    vehicles={budgetState.vehicles}
                  />
                )}
                {tracksMaintenance && (
                  <TireChangeInput
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
