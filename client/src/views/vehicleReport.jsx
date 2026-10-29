import React, { useContext, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { sub, format } from "date-fns";
import { FiDownload } from "react-icons/fi";
import { LuCar } from "react-icons/lu";
import { REQUEST_VEHICLE_REPORT_PDF } from "../utils/queries";
import { MetaLinkContext } from "../utils/metaLinks";
import { savePdf } from "../utils/download";
import { useStoreContext } from "../utils/GlobalState";
import { InlineMonthInput } from "../components/Forms";
import { defaultVehicleID } from "../components/Forms/FuelDetailsInput";

// "yyyy-MM" -> the server's "M/yy" month label
const monthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);
  return `${month}/${String(year).slice(-2)}`;
};

// a PDF of one vehicle's fill-ups and maintenance over whole months
const VehicleReports = ({ budgetState }) => {
  const [state] = useStoreContext();
  const { openVehicle } = useContext(MetaLinkContext);
  const vehicles = budgetState.vehicles || [];

  const [form, setForm] = useState({
    vehicleID: defaultVehicleID(vehicles, state.currentUser._id) || vehicles[0]?._id || "",
    startMonth: format(sub(new Date(), { months: 11 }), "yyyy-MM"),
    endMonth: format(new Date(), "yyyy-MM"),
  });
  const [errorState, setErrorState] = useState(null);

  const [getReport, { loading }] = useLazyQuery(REQUEST_VEHICLE_REPORT_PDF, {
    fetchPolicy: "no-cache",
    onCompleted: ({ requestVehicleReport }) => savePdf(requestVehicleReport, "vehicle-report.pdf"),
    onError: (err) => setErrorState(err.message),
  });

  if (!vehicles.length) {
    return <p className="empty-state">Add a vehicle in Settings to report on it.</p>;
  }

  const valid =
    form.vehicleID &&
    /^\d{4}-\d{2}$/.test(form.startMonth) &&
    /^\d{4}-\d{2}$/.test(form.endMonth) &&
    form.startMonth <= form.endMonth;
  const audit = { startMonth: valid, endMonth: valid };

  const download = () => {
    setErrorState(null);
    getReport({
      variables: {
        budgetID: budgetState._id,
        vehicleID: form.vehicleID,
        startMonth: monthLabel(form.startMonth),
        endMonth: monthLabel(form.endMonth),
      },
    });
  };

  return (
    <>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <div className="form-inline-select">
          <label htmlFor="report-vehicle">Vehicle</label>
          <select
            id="report-vehicle"
            value={form.vehicleID}
            onChange={(e) => setForm({ ...form, vehicleID: e.target.value })}
          >
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
                {v.plate ? ` (${v.plate})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="month-range">
          <InlineMonthInput
            prop={"startMonth"}
            input={form}
            setInput={setForm}
            label={"From"}
            max={form.endMonth}
            auditState={audit}
          />
          <InlineMonthInput
            prop={"endMonth"}
            input={form}
            setInput={setForm}
            label={"To"}
            min={form.startMonth}
            auditState={audit}
          />
        </div>
      </form>
      <p className="form-hint vehicle-report-hint">
        Summary figures, monthly consumption and spending charts, and every fill-up and
        maintenance record in the period.
      </p>
      {errorState && (
        <div className="banner banner-error" role="alert">
          {errorState}
        </div>
      )}
      <div className="vehicle-report-actions">
        {openVehicle && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openVehicle(form.vehicleID)}
            disabled={!form.vehicleID}
          >
            <LuCar /> Vehicle log
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={download}
          disabled={!valid || loading}
        >
          {loading ? <span className="spinner spinner-sm" /> : <FiDownload />}
          Download PDF
        </button>
      </div>
    </>
  );
};

export default VehicleReports;
