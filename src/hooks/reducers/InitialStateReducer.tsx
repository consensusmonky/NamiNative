import { Alert } from "react-native";

export const InitialStateReducer = (state: any, action: {type: string, status: {loadingScreen: {visible: boolean, useBackgroundImage: true, opacity: 1 }, offlineMessage: {visible: boolean}, exitAppTimeoutId: NodeJS.Timeout | undefined, initialized: boolean}}) => {
  
    switch (action.type) {
      
      case 'initialState':        
        // return state.loadingScreen = action.status.loadingScreen;
        
        state.status.loadingScreen = action.status.loadingScreen;
        state.status.offlineMessage = action.status.offlineMessage;
        state.status.exitAppTimeoutId = action.status.exitAppTimeoutId;
        state.status.initialized = action.status.initialized;
        return {
          ...state,
          // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        };
        // case 'initialState':        
        // // return state.loadingScreen = action.status.loadingScreen;
        
        // state.status.loadingScreen = action.status.loadingScreen;
        // state.status.offlineMessage = action.status.offlineMessage;
        // return {
        //   ...state,
        //   // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        // };
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
        case 'setExitAppTimeout':        
        // return state.offlineMessage = action.status.offlineMessage;
        state.status.exitAppTimeoutId = action.status.exitAppTimeoutId;
        return {
          ...state,
          // status: {loadingScreen: action.status.loadingScreen, offlineMessage: {visible: true} }
        };
        
        case 'setInitializeState':        
        // return state.offlineMessage = action.status.offlineMessage;
        state.status.initialized = action.status.initialized;
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