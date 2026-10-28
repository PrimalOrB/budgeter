import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  FiStar,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiBarChart2,
} from "react-icons/fi";
import { Title } from "../components/Layout";
import { InlineError } from "../components/Notifications";
import {
  SAVE_VEHICLE,
  DELETE_VEHICLE,
  SET_DEFAULT_VEHICLE,
  SET_VEHICLE_ODOMETER,
} from "../utils/mutations";

const blankForm = { make: "", model: "", year: "", plate: "", color: "", odometer: "" };

export const formatKm = (km) =>
  `${Math.round(km || 0).toLocaleString("en-US")} km`;

// colour names like "Blue" become a swatch; anything CSS doesn't know is grey
export const VehicleSwatch = ({ color }) => (
  <span
    className="vehicle-swatch"
    style={{ backgroundColor: color || undefined }}
    title={color || "No colour"}
    aria-hidden="true"
  />
);

const VehicleSettings = ({ budgetState, currentUser, refetch, onOpenVehicle }) => {
  const vehicles = budgetState.vehicles || [];
  const [editing, setEditing] = useState(null); // null, "new" or a vehicle id
  const [form, setForm] = useState(blankForm);
  const [errorState, setErrorState] = useState(null);

  const done = () => {
    setErrorState(null);
    refetch();
  };
  const onError = (err) => setErrorState(err.message);

  const [saveVehicle, { loading: saving }] = useMutation(SAVE_VEHICLE, { onError });
  const [setOdometer] = useMutation(SET_VEHICLE_ODOMETER, { onError });
  const [deleteVehicle] = useMutation(DELETE_VEHICLE, { onCompleted: done, onError });
  const [setDefault] = useMutation(SET_DEFAULT_VEHICLE, { onCompleted: done, onError });

  const startEdit = (vehicle) => {
    setErrorState(null);
    if (!vehicle) {
      setEditing("new");
      setForm(blankForm);
      return;
    }
    setEditing(vehicle._id);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : "",
      plate: vehicle.plate || "",
      color: vehicle.color || "",
      odometer: String(Math.round(vehicle.odometer || 0)),
    });
  };

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const year = form.year.trim() ? Number(form.year) : null;
    const { data } = await saveVehicle({
      variables: {
        input: {
          budgetID: budgetState._id,
          vehicleID: editing === "new" ? null : editing,
          make: form.make,
          model: form.model,
          year,
          plate: form.plate,
          color: form.color,
        },
      },
    });
    if (!data) {
      return;
    }
    // set the odometer when it was entered or changed
    const saved =
      editing === "new"
        ? data.saveVehicle.vehicles[data.saveVehicle.vehicles.length - 1]
        : vehicles.find((v) => v._id === editing);
    const reading = form.odometer.trim() === "" ? null : Number(form.odometer);
    if (
      saved &&
      reading !== null &&
      Number.isFinite(reading) &&
      Math.round(reading) !== Math.round(saved.odometer || 0)
    ) {
      await setOdometer({
        variables: { budgetID: budgetState._id, vehicleID: saved._id, odometer: reading },
      });
    }
    setEditing(null);
    done();
  };

  const isMyDefault = (vehicle) => vehicle.defaultFor?.includes(currentUser._id);

  const formFields = (
    <form className="vehicle-form" onSubmit={submit} autoComplete="off">
      <div className="vehicle-form-grid">
        <label>
          Make
          <input name="make" value={form.make} onChange={update} placeholder="Subaru" required />
        </label>
        <label>
          Model
          <input name="model" value={form.model} onChange={update} placeholder="WRX" required />
        </label>
        <label>
          Year
          <input name="year" value={form.year} onChange={update} inputMode="numeric" placeholder="2017" />
        </label>
        <label>
          Plate
          <input name="plate" value={form.plate} onChange={update} placeholder="Optional" />
        </label>
        <label>
          Colour
          <input name="color" value={form.color} onChange={update} placeholder="Blue" />
        </label>
        <label>
          Odometer (km)
          <input name="odometer" value={form.odometer} onChange={update} inputMode="numeric" placeholder="Current reading" />
        </label>
      </div>
      <p className="form-hint">
        The odometer moves on by each fill-up&apos;s km. Correcting it here keeps
        the logged distances and shifts the starting point.
      </p>
      <div className="vehicle-form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : editing === "new" ? "Add vehicle" : "Save vehicle"}
        </button>
      </div>
    </form>
  );

  return (
    <section className="full-container settings-card vehicles-card">
      <div className="vehicles-head">
        <Title
          text="Vehicles"
          subtitle="Used by categories that track mileage. Your default vehicle is picked when you log fuel."
        />
        {editing === null && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(null)}>
            <FiPlus /> Add vehicle
          </button>
        )}
      </div>
      {errorState && <InlineError text={errorState} />}
      {editing === "new" && formFields}
      {vehicles.length === 0 && editing !== "new" && (
        <p className="empty-state">No vehicles yet.</p>
      )}
      <ul className="vehicle-list">
        {vehicles.map((vehicle) =>
          editing === vehicle._id ? (
            <li key={vehicle._id} className="vehicle-item vehicle-item-editing">
              {formFields}
            </li>
          ) : (
            <li key={vehicle._id} className="vehicle-item">
              <VehicleSwatch color={vehicle.color} />
              <div className="vehicle-info">
                <span className="vehicle-name">
                  {vehicle.name}
                  {isMyDefault(vehicle) && <span className="badge badge-accent">Your default</span>}
                </span>
                <span className="vehicle-meta">
                  {[vehicle.color, vehicle.plate].filter(Boolean).join(" · ") || "No plate"}
                  {" · "}
                  {formatKm(vehicle.odometer)}
                  {" · "}
                  {vehicle.fillCount} fill-up{vehicle.fillCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="vehicle-actions">
                <button
                  type="button"
                  className={`icon-button icon-button-sm${isMyDefault(vehicle) ? " icon-button-active" : ""}`}
                  title={isMyDefault(vehicle) ? "Your default vehicle (click to clear)" : "Make this my default"}
                  aria-label={isMyDefault(vehicle) ? "Clear default vehicle" : "Make default vehicle"}
                  onClick={() =>
                    setDefault({
                      variables: {
                        budgetID: budgetState._id,
                        vehicleID: isMyDefault(vehicle) ? null : vehicle._id,
                      },
                    })
                  }
                >
                  <FiStar />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button-sm"
                  title="Fuel log"
                  aria-label={`Fuel log for ${vehicle.name}`}
                  onClick={() => onOpenVehicle(vehicle._id)}
                >
                  <FiBarChart2 />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button-sm"
                  title="Edit"
                  aria-label={`Edit ${vehicle.name}`}
                  onClick={() => startEdit(vehicle)}
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button-sm"
                  title={vehicle.fillCount ? "Vehicles with fill-ups can't be deleted" : "Delete"}
                  aria-label={`Delete ${vehicle.name}`}
                  disabled={vehicle.fillCount > 0}
                  onClick={() =>
                    deleteVehicle({ variables: { budgetID: budgetState._id, vehicleID: vehicle._id } })
                  }
                >
                  <FiTrash2 />
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );
};

export default VehicleSettings;
