import { createContext, useContext } from "react";
import { gql, useApolloClient } from "@apollo/client";
import { FiTruck } from "react-icons/fi";

// Entries carrying details for a category's meta type (fuel details on a
// mileage category) link to the page for that data. App provides the
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

// a short figure from the linked data to show beside the entry's title,
// e.g. fuel economy; null when the entry has no such data
export function entryMetaStat(entry) {
  const { litres, distance } = entry?.mileage || {};
  if (litres && distance) {
    return `${((litres / distance) * 100).toFixed(1)} L/100 km`;
  }
  return null;
}

// { icon, label, open } for an entry with linked data, or null
export function useMetaLink(entry) {
  const { openVehicle } = useContext(MetaLinkContext);
  const vehicleID = entry?.mileage?.vehicleID;
  const vehicleName = useVehicleName(vehicleID);
  if (vehicleID && openVehicle) {
    return {
      icon: FiTruck,
      label: `Fuel log for ${vehicleName || "this vehicle"}`,
      open: () => openVehicle(vehicleID),
    };
  }
  return null;
}
