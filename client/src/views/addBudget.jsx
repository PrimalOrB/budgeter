import React, { useState, useEffect } from "react";
import { ActionButton } from "../components/Buttons";
import {
  InlineTextInput,
  InlineTextareaInput,
  InlineListDisplay,
  InlineEmailInput,
} from "../components/Forms";
import { InlineError, InlineNotification } from "../components/Notifications";
import { useStoreContext } from "../utils/GlobalState";
import { useMutation } from "@apollo/client";
import { CREATE_NEW_BUDGET } from "../utils/mutations";
import { useNavigate } from "react-router-dom";
import { Title } from "../components/Layout";

const AddBudget = () => {
  const [state] = useStoreContext();
  const navigate = useNavigate();

  const initialFormState = {
    title: "",
    desc: "",
    email: "",
    owner: "",
    emails: [],
  };
  const [formInput, setFormInput] = useState({ ...initialFormState });
  const [auditState, setAuditState] = useState({ pass: false });
  const [errorState, setErrorState] = useState();
  const [populated, setPopulated] = useState(false);

  useEffect(() => {
    if (state?.currentUser) {
      setFormInput({
        ...formInput,
        owner: state.currentUser.email,
      });
      setPopulated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function audit() {
    const currentAuditState = { ...auditState },
      currentFormState = { ...formInput };

    const auditField = [];

    const textRequired = ["title", "desc", "owner"];
    textRequired.map((field) => {
      if (currentFormState[field] === undefined) {
        currentAuditState[field] = false;
      } else {
        currentAuditState[field] = currentFormState[field].length > 0;
      }
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
    useMutation(CREATE_NEW_BUDGET, {
      variables: {
        input: {
          owner: formInput.owner,
          emails: formInput.emails,
          title: formInput.title,
          desc: formInput.desc,
        },
      },
      update: (cache, data) => {
        try {
          if (data) {
            return navigate(`/budget/${data.data.createBudget._id}`);
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
      <Title text={`Create New Budget`} />
      {errorState ? (
        <InlineError text={errorState} />
      ) : (
        <>
          <form autoComplete="off">
            <InlineTextInput
              prop={"title"}
              input={formInput}
              setInput={setFormInput}
              label={"Budget Title"}
              auditState={auditState}
            />
            <InlineTextareaInput
              prop={"desc"}
              input={formInput}
              setInput={setFormInput}
              label={"Description"}
              auditState={auditState}
            />
            <InlineListDisplay
              input={formInput}
              setInput={setFormInput}
              label={"Owners"}
            />
            <InlineEmailInput
              prop={"email"}
              input={formInput}
              setInput={setFormInput}
              label={"Add More Owners"}
              placeholder={"Type or paste email addresses and press `Enter`"}
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

export default AddBudget;
