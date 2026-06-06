import { createContext, useContext, useReducer, useCallback } from "react";
import { getPiquetes, getEventos, getProjecoes } from "../services/api";

// ==========================================
// State & Reducer
// ==========================================

const initialState = {
  piquetes: [],
  eventos: [],
  projecoes: [],
  loading: true,
  error: null,
};

function piqueteReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_DATA":
      return {
        ...state,
        piquetes: action.payload.piquetes,
        eventos: action.payload.eventos,
        projecoes: action.payload.projecoes,
        loading: false,
        error: null,
      };
    case "UPDATE_PIQUETE":
      return {
        ...state,
        piquetes: state.piquetes.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        ),
      };
    default:
      return state;
  }
}

// ==========================================
// Context
// ==========================================

const PiqueteContext = createContext(null);

export function PiqueteProvider({ children }) {
  const [state, dispatch] = useReducer(piqueteReducer, initialState);

  const fetchAll = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [piquetes, eventos, projecoes] = await Promise.all([
        getPiquetes(),
        getEventos(),
        getProjecoes(),
      ]);
      dispatch({ type: "SET_DATA", payload: { piquetes, eventos, projecoes } });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  const updatePiquete = useCallback((id, data) => {
    dispatch({ type: "UPDATE_PIQUETE", payload: { id, data } });
  }, []);

  return (
    <PiqueteContext.Provider value={{ ...state, fetchAll, updatePiquete }}>
      {children}
    </PiqueteContext.Provider>
  );
}

export function usePiqueteContext() {
  const ctx = useContext(PiqueteContext);
  if (!ctx) {
    throw new Error("usePiqueteContext must be used within PiqueteProvider");
  }
  return ctx;
}
