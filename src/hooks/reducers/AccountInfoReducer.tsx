import { Alert } from "react-native";

export const AccountInfoReducer = (state: any, action: {type: string, value: any}) => {
  
    switch (action.type) {
      
      case 'setAddress':
        return {
          ...state,
          address: action.value
        };
      case 'setValue':
        return {
          ...state,
          value: action.value
        };
      case 'setMessage':
        return {
          ...state,
          message: action.value
        };
      case 'setTxInfo':
        return {
          ...state,
          txInfo: action.value
        };
      case 'setFee':
        return {
          ...state,
          fee: action.value
        };
      case 'setTx':
        return {
          ...state,
          tx: action.value
        };
      

      default:
        return state;
    }
  };