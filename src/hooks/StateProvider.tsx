import React, {createContext, useContext, useReducer} from 'react';
export const StateContext = createContext({} as any);


export const StateProvider = (
    {reducer, 
     initialState,
     children}: {reducer: any, initialState: any, children: JSX.Element | JSX.Element[]}) =>(
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
);
export const useStateValue = () => useContext(StateContext);