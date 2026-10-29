import { createContext, useContext } from "react";
import { gql, useApolloClient } from "@apollo/client";
import { LuCar } from "react-icons/lu";

// Entries carrying details for a category's meta type (fuel or maintenance
// details) link to the page for that data. App provides the
// handlers; anything outside it simply shows no link.
export const MetaLinkContext = createContext({});

// the vehicle is already in the cache from the budget query
const VEHICLE_NAME = gql`
  fragment VehicleName on Vehicle {
    name
  }
`;

export function useVehicleName(vehicleID) {
  const client = useApolloClient();
  if (!vehicleID) {
    return null;
  }
  const vehicle = client.readFragment({
    id: client.cache.identify({ __typename: "Vehicle", _id: vehicleID }),
    fragment: VEHICLE_NAME,
  });
  return vehicle?.name || null;
}

// a short figure from the linked data to show beside the entry's title:
// fuel economy, or the odometer at a maintenance visit; null for none
export function entryMetaStat(entry) {
  const { litres, distance } = entry?.mileage || {};
  if (litres && distance) {
    return `${((litres / distance) * 100).toFixed(1)} L/100 km`;
  }
  const odometer = entry?.maintenance?.odometer;
  if (odometer) {
    return `${Math.round(odometer).toLocaleString("en-US")} km`;
  }
  return null;
}

// { icon, label, open } for an entry with linked data, or null
export function useMetaLink(entry) {
  const { openVehicle } = useContext(MetaLinkContext);
  const vehicleID = entry?.mileage?.vehicleID || entry?.maintenance?.vehicleID;
  const vehicleName = useVehicleName(vehicleID);
  if (vehicleID && openVehicle) {
    return {
      icon: LuCar,
      label: `Vehicle log for ${vehicleName || "this vehicle"}`,
      open: () => openVehicle(vehicleID),
    };
  }
  return null;
}
