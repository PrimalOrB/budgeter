import { useReducer } from 'react';
import {
    UPDATE_USER,
} from "./actions";
  
export const reducer = ( state, action ) => {
    switch (action.type) {
        case UPDATE_USER:
            return {
                ...state,
                currentUser: action.currentUser,
            };  
        default:
        return state;
    }
};

export function useStateReducer( initialState ) {
    return useReducer( reducer, initialState );
}
