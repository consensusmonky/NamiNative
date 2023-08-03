import { Alert } from "react-native";

export const InitialStateReducer = (state: any, action: {type: string, status: {loadingScreen: {visible: boolean, useBackgroundImage: true, opacity: 1 }, offlineMessage: {visible: boolean}}}) => {
  
    switch (action.type) {
      
      case 'initialState':        
        // return state.loadingScreen = action.status.loadingScreen;
        
        state.status.loadingScreen = action.status.loadingScreen;
        state.status.offlineMessage = action.status.offlineMessage;
        return {
          ...state,
          // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        };
      case 'changeLoadingScreenVisibility':        
        // return state.loadingScreen = action.status.loadingScreen;
        state.status.loadingScreen = action.status.loadingScreen;
        return {
          ...state,
          // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        };
      case 'changeOfflineMessageVisibility':        
        // return state.offlineMessage = action.status.offlineMessage;
        state.status.offlineMessage = action.status.offlineMessage;
        return {
          ...state,
          // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        };

      default:
        // state.status.loadingScreen = action.status.loadingScreen;
        // state.status.offlineMessage = action.status.offlineMessage;
        return {
          ...state,
          // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        };
    }
  };