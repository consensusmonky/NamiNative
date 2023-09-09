import { PendingRequestTypes, SessionTypes, SignClientTypes } from "@walletconnect/types";
import { Alert, AppState, BackHandler, EmitterSubscription, EventEmitter, Linking, Modal, SafeAreaView, Text, TextInput, TouchableOpacity, View, useColorScheme } from "react-native";
import useInitialization, { web3wallet } from "../utils/Web3WalletClient";
import { useCallback, useEffect, useRef, useState } from "react";
import { JsonRpcResponse, formatJsonRpcError } from "@walletconnect/jsonrpc-utils";
import { getSdkError  } from "@walletconnect/utils";
import { DefaultTheme } from "react-native-paper";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { getCurrentAccount, getNetwork, getUtxos } from "../services/NetworkDataProviderService";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { signTx } from "../utils/Ledger";
import { Address, Transaction, TransactionBody, TransactionUnspentOutput, TransactionWitnessSet, hash_transaction } from "@emurgo/react-native-haskell-shelley";
import { APIError, ERROR, NETWORK_ID, TxSendError } from "../config/config";
import { blockfrostRequest } from "../utils/ApiExtensions";
import Toast from "react-native-toast-message";
import { useStateValue } from "../hooks/StateProvider";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { makeStyles } from "../../style";
import SigningModal from "../screens/SigningModal/SigningModal";
import { requestAccountKey } from "../utils/WalletServiceProvider";
import PairingModal from "../screens/PairingModal/PairingModal";
import DeviceInfo, { PowerState, getBatteryLevel } from 'react-native-device-info';
import RNRestart from 'react-native-restart';

interface ProviderParameters {
    deepLink: any;
}

export const WalletConnectProvider = (props: ProviderParameters) => {
    
  const Stack = createNativeStackNavigator();
  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);
  const [{ initialLoadingReducer }, dispatch] = useStateValue();
  const appState = useRef(AppState.currentState);
  const loadingScreenTimeout = useRef<NodeJS.Timeout>();
  const userAcceptanceTimeout = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);
  const signingModalRef = useRef<{waitForResponse: () => Promise<JsonRpcResponse>}>();
  const [walletConnectDeepLinkEvent, setWalletConnectDeepLinkEvent] = useState<EmitterSubscription | undefined>(undefined);
  const deviceIsOffline = useRef(false);
  const deepLink = useRef("");
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected == initialLoadingReducer.status.offlineMessage.visible) {
      deviceIsOffline.current = !state.isConnected;
      if (deviceIsOffline.current) {
        isInitialized.current = false;
        web3wallet?.events?.removeAllListeners();
      }
      // if (!initialLoadingReducer.status.offlineMessage.visible) {
        dispatch({
          type: 'changeOfflineMessageVisibility',
          status: { offlineMessage: {visible: !state.isConnected} }
        });
      // }
      return;
    } 
    
    // console.log("Connection type", state.type);
    // console.log("Is connected?", state.isConnected);
  });

  useEffect(() => { 

    if (!initialLoadingReducer.status.initialized) {
        return;
    }
    
    Linking.addEventListener("url", (event) => {
        openDeepLink(event.url);
    });

    return () => {
      //web3wallet.events.removeAllListeners("url");
      Linking.removeAllListeners("url");
    }

  }, [initialLoadingReducer.status.initialized, web3wallet])

  const [modalVisible, setModalVisible] = useState(false);
  const [savedPasswordTimeoutId,setSavedPasswordTimeoutId] = useState({} as NodeJS.Timeout);
  const [signingModalVisible, setSigningModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [successfulSession, setSuccessfulSession] = useState(false);
  // const [existingWallet, setExistingWallet] = useState<AccountInfo | undefined>(undefined);
  const [currentWCURI, setCurrentWCURI] = useState("");
  const [password, setPassword] = useState("");
  const [validPassword, setValidPassword] = useState(false);
  const [message, setMessage] = useState("");
  const currentProposal = useRef({} as SignClientTypes.EventArguments["session_proposal"]);

  const [requestSession, setRequestSession] = useState({} as any);
  const [requestEvent, setRequestEvent] = useState({} as SignClientTypes.EventArguments["session_request"] | undefined);
  const url = useRef("");
  
  const closeWalletTimeout = useRef<NodeJS.Timeout>();
  const waitForResponseTimeout = useRef<NodeJS.Timeout>();
  const incomingSessionEvent = useRef<NodeJS.Timeout>();
  const requestStack = useRef<Array<boolean>>([]);
  
  const onSuccess = (e: any) => {
    Linking.openURL(e.data).catch(err =>
      console.error('An error occured', err)
    );
  };
  
  const onSessionProposal = useCallback(
    async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      
      clearTimeout(incomingSessionEvent.current);
      clearTimeout(closeWalletTimeout.current);
      clearTimeout(userAcceptanceTimeout.current);
      dispatch({
        type: 'changeLoadingScreenVisibility',
        status: { loadingScreen: {visible: true, useBackgroundImage: false, opacity: 0.95} }
      });
      
      console.log("proposal:----->");
      currentProposal.current = proposal;
      setModalVisible(true);

      userAcceptanceTimeout.current = setTimeout(() => {
        handleReject("USER ACCEPTANCE TIMEOUT");
      }, 15000);
      // setCurrentProposal(proposal);
    },
    [currentProposal]
  );

  const onSessionRequest = useCallback(
    async (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      
      clearTimeout(incomingSessionEvent.current);
      clearTimeout(closeWalletTimeout.current);
      clearTimeout(waitForResponseTimeout.current);      
      requestStack.current.push(false);

      dispatch({
        type: 'changeLoadingScreenVisibility',
        status: { loadingScreen: {visible: true, useBackgroundImage: false, opacity: 0.95} }
      });     
      
      // const batteryLevel = await getBatteryLevel();
      DeviceInfo.getPowerState().then(async (state) => {
        if ((state?.batteryLevel && state?.batteryLevel <= 0.1 && state?.batteryState && state?.batteryState == "unplugged" || state?.lowPowerMode) && requestStack.current.length == 1) {
          Toast.show({text1: 'Your battery is low. Your dApp connection may fail.', type: "error" })
          await new Promise<void>((resolve, _) => {
              setTimeout(() => {
                  return resolve();
              }, 0);
          });
        }
      });      

      console.log("KEIN ERRROR 1")
      var goBackToDApp = false;
      var forceClose = false;

      
      var requestIndex = requestStack.current.length - 1;
      const prevIndex = requestIndex - 1;
      console.log("PREVINDEX")
      console.log(prevIndex)
      if (prevIndex >= 0) {
        requestStack.current[prevIndex] = true;
      }

      const topic = requestEvent?.topic;
      const params = requestEvent?.params;
      const id = requestEvent?.id ?? 0;

      const { request } = params;
      if (topic) {
        const requestSessionData = web3wallet.engine.signClient.session.get(topic);
        setRequestSession(requestSessionData);
      }
      console.log("KEIN ERRROR 2")
      const network = getNetwork();
      // const requestMetadata: SignClientTypes.Metadata = requestSessionData?.peer?.metadata;
      console.log("SESSION_REQUEST: " + request.method)
      // Alert.alert("SESSION_REQUEST: " + request.method);
      if (id == 0) {
        console.log("NO ID");
        return;
      }
      // setTimeout(() => {
      //   Alert.alert("SessionRequestID: ", id.toString());
      // }, 5000);      

      console.log("REQUEST_ID: ");
      console.log(id);      

        var response: JsonRpcResponse = 
        {
          id,
          jsonrpc: "2.0",
          result: ""
        }
        var lovelace = "";
        var myAddress = "";
        var paymentKeyHash = "";
        const existingWallet = getCurrentAccount();
        
        if (existingWallet !== undefined) {
          lovelace = ((existingWallet[network?.id]?.lovelace) as string);
          const adr = await ((await Address.from_bech32(existingWallet[network?.id]?.paymentAddr as string)) as Address).to_bytes();
          myAddress = Buffer.from(adr).toString('hex');
          paymentKeyHash = existingWallet.paymentKeyHash;
        }
       
        var activeSessions = await web3wallet?.getActiveSessions();
        var activeSessionTopic = "";
        // console.log(activeSessions);
        if (activeSessions) {
          Object.keys(activeSessions).map(async (topic: string, _,) => {
            console.log("YEEEEEEEAAH")
            console.log(topic)
            activeSessionTopic = topic;              
            
            // await web3wallet.disconnectSession({
            //   topic: topic,
            //   reason: {code: 0,  message: "USER DISCONNECTED"},
            // });
          }) 
        }
        
        // if (!activeSessionTopic) {
        //   console.log("LEIDER NEIN")
        //   return;
        // }
        
      request.params?.map((para : any) => {
        console.log(para)
      })
      console.log("KEIN ERRROR 3")
      switch (request.method) {
        case "cardano_getBalance":
          response = 
            {
              id,
              jsonrpc: "2.0",
              result: lovelace
            }
            goBackToDApp = true;
            // handleDeepLinkRedirect(requestMetadata?.redirect);
            // BackHandler.exitApp();
          break;
        case "cardano_exitWallet":
          if (request?.params[0]) {
            Toast.show({text1: request?.params[0], type: "error" })
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                dispatch({
                  type: 'changeLoadingScreenVisibility',
                  status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
                });

                BackHandler.exitApp();
                return resolve();
              }, 2300)
            });
          } else {
            goBackToDApp = true;
          }          

          response = 
              {
                id,
                jsonrpc: "2.0",
                result: "WalletExited"
              }
          break;
        case "cardano_signTx":
            setRequestEvent(requestEvent);
            // if (!validPassword) {
            //    setPasswordModalVisible(true);
            // } else {
               setSigningModalVisible(true);
            // }           
          
           const txSigned = await signingModalRef.current?.waitForResponse();
           if (txSigned != undefined) {
            response = txSigned;
           }
           goBackToDApp = true;
          
          //  if (txSigned != undefined) {
          //    Alert.alert(txSigned?.toString());
          //  }
          //  if (txSigned) {
            // var unsignedTx = request?.params[0];
                    
            // const tx = await Transaction.from_hex(unsignedTx);
            // var txBody = await tx?.body();
            // var txBodyHash = "";
            // if (txBody != undefined)
            // {
            //   txBodyHash = Buffer.from(await txBody.to_bytes()).toString("hex");
            //   // const outputs = await txBody.outputs();
            //   // const outt = await outputs.to_json() as string;
            //   // const utxos = JSON.parse(outt);            
            // }
            
          //   var txCbor = "";
          //   var witnessSetCbor = "";

          //   var paymentKeyHash = "";
          //   if (existingWallet !== undefined) {          
          //     paymentKeyHash = existingWallet.paymentKeyHash;
          //   }
          //   const txHash = await hash_transaction(await tx?.body() as TransactionBody);
          //   if (txBodyHash && txBody) {
          //     var signedWitnessSet = await signTx(
          //       txHash,
          //       [paymentKeyHash],
          //       password,
          //       0
          //     );
          //     // console.log("BBBB: ");
          //     const signedTransaction = await createTransaction(txBody, signedWitnessSet);
          //     txCbor = Buffer.from(await signedTransaction.to_bytes()).toString('hex');  
          //     witnessSetCbor = Buffer.from(await signedWitnessSet.to_bytes()).toString('hex');  
          //   }
          //   response = 
          //     {
          //       id,
          //       jsonrpc: "2.0",
          //       result: witnessSetCbor
          //     }
          //   goBackToDApp = true;
          // } else {
          //   //rejectSession
          //   response = formatJsonRpcError(id, getSdkError("USER_REJECTED").message);            
          // }
          break;
        case "cardano_getNetworkId":
            response = 
              {
                id,
                jsonrpc: "2.0",
                result: network?.id
              }
            goBackToDApp = true;
            break;
        case "cardano_submitTx":
          var signedTxCbor = request.params[0];

          const txHashResult = await submitTx(signedTxCbor)
          goBackToDApp = true;
          forceClose = true;
          

          response = 
            {
              id,
              jsonrpc: "2.0",
              result: txHashResult
            }
          break;
        case "cardano_getUtxos":
          // var utxos = new Array<string>();
          let utxos = await getUtxos() as TransactionUnspentOutput[];
          const _utxosHashes: string[] = await Promise.all(utxos?.map(async (utxo: any) => Buffer.from(await utxo.to_bytes(), 'hex').toString('hex') ))
          if (existingWallet !== undefined) {
            // utxos = existingWallet[network.id]?.history.confirmed as string[];
          }    
          goBackToDApp = true;        
          response = 
            {
              id,
              jsonrpc: "2.0",
              result: _utxosHashes
            }
          break;
        case "cardano_getUsedAddresses":
          console.log("MY ADDRESS: " + myAddress);
          goBackToDApp = true;
          response = 
            {
              id,
              jsonrpc: "2.0",
              result: [myAddress]
            }
          break;
        case "cardano_getUnusedAddresses":
          goBackToDApp = true;
        response = 
            {
              id,
              jsonrpc: "2.0",
              result: []
            }
          break;
        default:
          break;
      }
      console.log("KEIN ERRROR 4")            
        web3wallet.respondSessionRequest({topic: topic, response: response}).then(() => {
          console.log("KEIN ERRROR 5")
          console.log(requestStack.current.length?.toString());
          if (goBackToDApp) {
            clearTimeout(loadingScreenTimeout.current);
            closeWalletTimeout.current = setTimeout(async () => {
              // clearTimeout(timeout);
              await new Promise<void>((resolve, _) => {
                  setTimeout(() => {  
                    console.log("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY")                  
                    requestStack.current[requestIndex] = true;
                    resolve();
                  }, 200);
              })
              console.log("AUSEN")
              if ((requestStack.current.length == 0 || requestStack.current.indexOf(false) >= 0) && !forceClose) {
                console.log("DADADA")
                console.log(requestStack.current)
                return;
              }
              
              dispatch({
                type: 'changeLoadingScreenVisibility',
                status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
              });
              closeWalletTimeout.current = undefined;
              clearTimeout(closeWalletTimeout.current);
              if (requestStack.current.length > 0) {     
                console.log("FINNALLLYYY")           
                clearTimeout(loadingScreenTimeout.current);
                requestStack.current = [];
                BackHandler.exitApp();
              }              
            }, 1500);
            dispatch({
              type: 'setExitAppTimeout',
              status: { exitAppTimeoutId: closeWalletTimeout.current }
            });
            clearTimeout(loadingScreenTimeout.current);
            loadingScreenTimeout.current = setTimeout(() => {
              console.log("REMOVE SCREEN");
              dispatch({
                type: 'changeLoadingScreenVisibility',
                status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
              });
            }, 5000);
            // resetTimeout
            
            // const timeout = setTimeout(() => {
            //   console.log("TIMEOUT RESET");
            //   closeWalletTimeout.current = undefined;
            //   requesting.current = false;
            // }, 5000);

          } else {
            setTimeout(() => {
              dispatch({
                type: 'changeLoadingScreenVisibility',
                status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
              });
            }, 3000);
          }     
        }).catch((error) => {
            console.log("Response Fehler. " + error);
        });
      
    },
    [closeWalletTimeout, dispatch]
    
  );
  

  
  // useEffect(() => {
  //   let sessionProposalEvent: EventEmitter | undefined;
  //   let sessionRequestEvent: EventEmitter | undefined;

  //   if (!web3wallet) {
  //     //return;
  //   }

    
  //   const appStateListener = AppState.addEventListener(
  //     'change',
  //     nextAppState => {
  //       if (
  //         // appState.current.match(/inactive|background/) &&
  //         nextAppState === 'active'
  //       ) {
  //         requestStack.current = [];
  //         clearTimeout(closeWalletTimeout.current);
  //         clearTimeout(waitForResponseTimeout.current);
  //         closeWalletTimeout.current = undefined;
  //         dispatch({
  //           type: 'changeLoadingScreenVisibility',
  //           status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
  //         });
  //         // dispatch({
  //         //   type: 'changeLoadingScreenVisibility',
  //         //   status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
  //         // });
  //         // sessionProposalEvent = web3wallet.on("session_proposal", onSessionProposal.bind(this));
  //         // sessionRequestEvent = web3wallet.on("session_request", onSessionRequest.bind(this)); 
  //       }
  
  //       appState.current = nextAppState;
  //     },
  //   );
  //   return () => {
  //     appStateListener?.remove();
  //     if (sessionRequestEvent) {
  //       //  web3wallet.removeListener("session_proposal", onSessionProposal.bind(this));
  //       //  web3wallet.removeListener("session_request", onSessionRequest.bind(this));
  //     }
  //   };
  // }, [])


  useEffect(() => {
    deepLink.current = props.deepLink;
  }, [props.deepLink]);


  useEffect(() => {

    //if (initialLoadingReducer.status.offlineMessage.visible)
    //{
      // setIsInitialized(false);
      //return;
    //}

    if (!initialLoadingReducer.status.initialized || (initialLoadingReducer.status.offlineMessage.visible)) {
      console.log("NOOOOOO")
          return;
    }

    const init  =  async ()=> {
      const noConnectionResult = await new Promise<boolean>((resolve, _) => {
        if (!deviceIsOffline.current) {
            return resolve(true);
        }
        isInitialized.current = false;
        setTimeout(() => {
            console.log("REINIIT")
            resolve(!deviceIsOffline.current);
        }, 10000);
      });
  
      if (!noConnectionResult) {
        Toast.show({
          type: 'error',
          text1: 'Your device may be offline. Please try again after a stable connection.'
        });
        console.log("REEEETTTT")
        return;
      }
      console.log("INIIIIT")
      // await web3wallet?.engine?.init();

      // Alert.alert("111")
      useInitialization().then(() => {
        console.log('App Initalized: ', initialLoadingReducer.status.initialized);
        // Alert.alert("222")
        // Linking.addEventListener("url", (event) => {
        //   openDeepLink(event.url);
        // });
    
        // Linking.getInitialURL().then((url) => {
        //   if (url) {
        //     dispatch({
        //       type: 'changeLoadingScreenVisibility',
        //       status: { loadingScreen: {visible: true, useBackgroundImage: true, opacity: 1} }
        //     });
        //     openDeepLink(url, true);
        //   }
        // }).catch(err => {
        //   return err;
        // });

      web3wallet.on("session_proposal", onSessionProposal.bind(this));
      web3wallet.on("session_request", onSessionRequest.bind(this)); 
      
      isInitialized.current = true;
      if (deepLink.current) {
        // when app is closed. Use initial link.
        openDeepLink(deepLink.current)  
        deepLink.current = "";
      }

    });
  }

  init();    

  const appStateListener = AppState.addEventListener(
    'change',
    nextAppState => {
      if (
        // appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // deviceIsOffline.current = false;
        requestStack.current = [];
        clearTimeout(closeWalletTimeout.current);
        // clearTimeout(waitForResponseTimeout.current);
        closeWalletTimeout.current = undefined;
        dispatch({
          type: 'changeLoadingScreenVisibility',
          status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
        });
      }

      appState.current = nextAppState;
    },
  );

  return () => {
    web3wallet?.events?.removeAllListeners();
    appStateListener?.remove();
  //   Linking.removeAllListeners("url");
  }
}, [initialLoadingReducer.status.initialized, initialLoadingReducer.status.offlineMessage.visible]);

  // useEffect(() => {
    

  //   return () => {
      
  //   };
  // }, []);
  
  const openDeepLink = useCallback(async (urlPara = "", showLoadingScreenBackground = false) => {
    
    urlPara = urlPara ?? url.current;

    if (!urlPara || urlPara.indexOf("wc:") < 0) {
      // Alert.alert("Deeplink Info", "<LINK IS EMPTY, WHY?>");
      return;
    }

    // Alert.alert("Deeplink Info", urlPara);

    // dispatch({
    //   type: 'changeOfflineMessageVisibility',
    //   status: { offlineMessage: {visible: true} }
    // })?.bind(this);
    
    await Linking.canOpenURL(urlPara!).then(async (supported) => { 
      
      if (supported) {
        let removeLoadingScreenTimeoutId: NodeJS.Timeout | undefined = undefined;
        try {
            
        // event.url = ""
        // removeLoadingScreenTimeoutId = setTimeout(() => {
        //   dispatch({
        //     type: 'changeLoadingScreenVisibility',
        //     status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
        //   });
        //   Alert.alert("Something went wrong during the dApp request. Please reconnect your dApp.")
        // }, 25000)
          
          // Object.values(web3wallet.getActiveSessions()).map(async (session: any) => console.log(await session.topic))
          const noConnectionResult = await new Promise<boolean>((resolve, _) => {
            console.log("HAAAA")
            console.log(isInitialized.current)
            if (isInitialized.current) {
                resolve(true);
            }
            
            setTimeout(() => {
                resolve(isInitialized.current);
            }, 10000);
          });

          incomingSessionEvent.current = setTimeout(() => {
              RNRestart.restart();    
            }, 15000)

          console.log("NOOOOOO2222")       
          dispatch({
            type: 'changeLoadingScreenVisibility',
            status: { loadingScreen: {visible: true, useBackgroundImage: showLoadingScreenBackground, opacity: 0.95} }
          });
          console.log("NO33")
          /*
          const pendingSessionProposals = web3wallet.getPendingSessionProposals();
          const pendingSessionRequests = web3wallet.getPendingSessionRequests();
          // const sess = Object.keys(web3wallet.getActiveSessions())[0].slice(3);
          

          console.log(pendingSessionRequests.length)

          // pendingSessionRequests.map(m => {
          //   try {
          //     var response = 
          //     {
          //       id: m.id,
          //       jsonrpc: "2.0",
          //       result: []
          //     }           
        
              
          
          //     // const respone = formatJsonRpcError(m.id, getSdkError("USER_REJECTED").message);
          //     console.log(m)
          //     console.log(m.topic)
          //     console.log(sess)
          //     // web3wallet.respondSessionRequest({topic: m.topic, response: response})
          //     // web3wallet.respondSessionRequest({
          //     //   topic: m.topic,
          //     //   response: respone
          //     // });
          //   } catch (error) {
              
          //   }
          // })
*/
          // if (Object.keys(pendingSessionProposals).length == 0 && pendingSessionRequests.length == 0) {
          //     Alert.alert("NO REQUESTS");
          // }

          var sessionAvailable = false;   
          
          var activeSessions = await web3wallet?.getActiveSessions();
          var activeSessionTopic = "";
          // console.log(activeSessions);
          if (activeSessions) {
            Object.keys(activeSessions).map(async (topic: string, _,) => {
              console.log("Session: ")
              console.log(topic)
              sessionAvailable = true;
              activeSessionTopic = topic;              
              
              // await web3wallet.disconnectSession({
              //   topic: topic,
              //   reason: {code: 0,  message: "USER DISCONNECTED"},
              // });
            }) 
          }

          var splitUrl = urlPara!.split("@");
          var sessionSplit = urlPara!.split("sessionTopic=");
          var sessionTopic = "";
          if (sessionSplit.length > 1)
          {
            sessionTopic = sessionSplit[1];
          }
          
          var topic = "";
          if (splitUrl.length > 1)
          {
            topic = splitUrl[0].slice(3);
          }
          let sessionResponseTimeout = 8000;
          
          console.log(urlPara);
          if ( urlPara!.split("?requestId=").length > 1) {
            
            if (!sessionAvailable) {
                
                // const pendingSessionProposals = web3wallet.getPendingSessionProposals();              
                // const pendingSessionRequests = web3wallet.getPendingSessionRequests();              
                
                // pendingSessionRequests.map((sessionReq: PendingRequestTypes.Struct) => {
                //     web3wallet.rejectSession({id: sessionReq.id, reason: {code: 1,  message: "USER_REJECTED_METHODS"}})
                // });
                
                // var pairings = web3wallet.core.pairing.getPairings();
                // pairings.map((pair: any) => {
                //     web3wallet.core.pairing.disconnect({topic: pair.topic});
                // });
                
                // const respones = formatJsonRpcError(1, getSdkError("USER_REJECTED").message); 
                // await web3wallet.respondSessionRequest({
                //     topic: sessionTopic,
                //     response: respones
                // });
                dispatch({
                    type: 'changeLoadingScreenVisibility',
                    status: { loadingScreen: {visible: true, useBackgroundImage: showLoadingScreenBackground, opacity: 0.95} }
                });
                
                Toast.show({
                    type: 'error',
                    text1: 'Could not find any session. Please reconnect dApp.'
                });

                var pairings = web3wallet.core.pairing.getPairings();
                pairings.map((pair: any) => {
                  web3wallet.core.pairing.disconnect({topic: pair.topic});
                });

                closeWalletTimeout.current = setTimeout(async () => {    
                    clearTimeout(closeWalletTimeout.current);
                    sessionResponseTimeout = 0;
                    dispatch({
                        type: 'changeLoadingScreenVisibility',
                        status: { loadingScreen: {visible: false, useBackgroundImage: showLoadingScreenBackground, opacity: 0.95} }
                    });
                    BackHandler.exitApp();
                }, 3000);
                
                
              //rejectSession
              
              // Minimizer.goBack();         
              
              clearTimeout(removeLoadingScreenTimeoutId);
              return () => {
                //web3wallet?.events?.removeAllListeners();
              }
            }
             return;
            // const requestMetadata: SignClientTypes.Metadata = requestSession?.peer?.metadata;
            // handleDeepLinkRedirect(requestMetadata?.redirect);            
            // incomingSessionEvent.current = setTimeout(() => {
            //   var pairings = web3wallet.core.pairing.getPairings();
            //   pairings.map((pair: any) => {
            //     Alert.alert("PAIRING DISCONNECTED!")
            //     web3wallet.core.pairing.disconnect({topic: pair.topic});
            //   });
            //   Object.keys(activeSessions).map(async (topic: string) => {
            //     Alert.alert("SESSION DISCONNECTED!")
            //   await web3wallet.disconnectSession({
            //     topic: topic,
            //     reason: {code: 0,  message: "USER DISCONNECTED"},
            //    });
            //   });
              
            // }, 15000)
            
            // OFF FOR TESTING REASONS
            /*
            waitForResponseTimeout.current = setTimeout(() => {
              if (sessionTopic) {
                web3wallet.disconnectSession({topic: sessionTopic, reason: { code: 1, message: "INVALID_USED_WALLET_SESSION" }});
                console.log("DISCONNECT SESSION AFTER TIMEOUT")
                console.log(sessionTopic)
                dispatch({
                  type: 'changeLoadingScreenVisibility',
                  status: { loadingScreen: {visible: false} }
                });
              }
            }, sessionResponseTimeout);
            */
            
          }

          
          
          var pairings = web3wallet?.core.pairing.getPairings();        
          var existingPairing = pairings?.find((pair: any) => {
            return pair.topic == topic;
          });

          if (existingPairing?.topic == undefined) {
            // if (pairings.length == 0) {
              console.log("NEW PAIRING");
              console.log(topic);
              try {
                await web3wallet.pair({ uri: urlPara }).catch((error) => {
                  //Alert.alert(ERR)
                  web3wallet.core.pairing.disconnect({topic: topic});
                  dispatch({
                    type: 'changeLoadingScreenVisibility',
                    status: { loadingScreen: {visible: false, useBackgroundImage: showLoadingScreenBackground, opacity: 0.95} }
                  });
                  Toast.show({
                    type: 'error',
                    text1: error?.message,
                    // text2: 'This is some something 👋'
                  });
                  /*setTimeout(() => {
                    BackHandler.exitApp();
                  }, 3000)*/
                });                
              } catch (error) {
                // Alert.alert("asdasd")
              }
            // }              
          }
          else
          {
            console.log("ALREADY PAIRED")
            if (web3wallet.core.pairing.pairings.get(existingPairing?.topic)) {
                console.log("DISCONNECT AND DELETE ALREADY CONNECTED PAIRING")
                console.log(existingPairing?.topic)
                web3wallet.core.pairing.disconnect({topic: existingPairing?.topic});
                web3wallet.core.pairing.pairings.delete(existingPairing?.topic, {code: 1,  message: "RECONNECT"});
              }
              clearTimeout(removeLoadingScreenTimeoutId);
              BackHandler.exitApp();
            
            // web3wallet.rejectSession({id: sessionReq.id, reason: {code: 1,  message: "USER_REJECTED_METHODS"}})
            
            // if (existingPairing?.topic) {
            //   web3wallet.core.pairing.pairings.delete(topic, {code: 1,  message: "RECONNECT"});
            //   web3wallet.core.pairing.disconnect({ topic: existingPairing?.topic });
            // }
            
           
            if (!sessionAvailable)
            {
              // web3wallet.core.pairing.disconnect({ topic: topic });
              // if (appState.current.match(/active|background/)) {
              //   await new Promise<void>((resolve) => {
              //     setTimeout(() => {
              //       dispatch({
              //         type: 'changeLoadingScreenVisibility',
              //         status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
              //       });
              //       resolve();
              //       BackHandler.exitApp();
              //       const requestMetadata: SignClientTypes.Metadata = requestSession?.peer?.metadata;
              //       // handleDeepLinkRedirect(requestMetadata?.redirect);
              //     }, 500);
              //   });                
              // }
            }
          }
          
      } catch (error: any) {
        console.log(error?.message)
        clearTimeout(removeLoadingScreenTimeoutId);
        // dispatch({
        //   type: 'changeLoadingScreenVisibility',
        //   status: { loadingScreen: {visible: false, useBackgroundImage: showLoadingScreenBackground, opacity: 0.95} }
        // });
        // BackHandler.exitApp();
        return;
      }
    }  
    
      // const requestMetadata: SignClientTypes.Metadata = requestSession?.peer?.metadata;
      // console.log(requestMetadata)
    });
    
    // dispatch({
    //   type: 'changeOfflineMessageVisibility',
    //   status: { offlineMessage: {visible: false} }
    // });

    return () => {
      web3wallet?.events?.removeAllListeners();
    }

  }, [dispatch, web3wallet, appState, BackHandler, Linking])
    
  // useEffect(() => {
    
  //   if (isInitialized) {
  //     return;      
  //   }
  //   let sessionProposal: EventEmmiter;
  //   let sessionRequest: EventEmmiter;

  //   (console.log("OPEN web3wallet on INITIAL LOAD once!"))
  //   if (url) {
  //     // openDeepLink()
  //   }
    
  //   if (
  //     signingModalVisible ||
  //     passwordModalVisible ||
  //     modalVisible ||
  //     requestSession
  //   ) {
                   
  //   } 
    

  //   return () => {
  //     // Linking.removeAllListeners("url");
  //     // sessionProposal?.removeAllListeners();
  //     // sessionRequest?.removeAllListeners();
  //   }

  // }, [ 
  //     initialized,
  //     signingModalVisible,
  //     passwordModalVisible,
  //     modalVisible,
  //     requestSession,
  //     onSessionProposal,
  //     onSessionRequest,
  //     openDeepLink
  //   ]);

const submitTx = async (tx: any) => {
  const network = getNetwork();
  
  var submitUrl: string | undefined = undefined;
  if (network?.id === NETWORK_ID.mainnet) {
    submitUrl = network?.mainnetSubmit;
  } else if (network?.id === NETWORK_ID.preprod) {
    submitUrl = network?.preprodSubmit;
  } else if (network?.id === NETWORK_ID.preview) {
    submitUrl = network?.previewSubmit;
  }
  if (submitUrl) {
    const result = await fetch(submitUrl as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/cbor' },
      body: Buffer.from(tx, 'hex'),
    });
    
    if (result.ok) {
      return await result.json();
    }
    throw APIError.InvalidRequest;
  }
  
  const result = await blockfrostRequest(
    `/tx/submit`,
    { 'Content-Type': 'application/cbor' },
    Buffer.from(tx, 'hex') as any
  );

  if (result.error) {
    if (result.status_code === 400)
      throw { ...TxSendError.Failure, message: result.message };
    else if (result.status_code === 500) throw APIError.InternalError;
    else if (result.status_code === 429) throw TxSendError.Refused;
    else if (result.status_code === 425) throw ERROR.fullMempool;
    else throw APIError.InvalidRequest;
  }
  return result;
};

const createTransaction = async (txBody: TransactionBody, witnessSet: TransactionWitnessSet) => {
  const transaction = (await Transaction.new(
    txBody,
    witnessSet,
    undefined
  )) as Transaction;
  
  return transaction;
}


const signAndSubmit = async (
  txBody: TransactionBody,
  { keyHashes, accountIndex }: any,
  password: any
) => {
  
  // const txBody = (await TransactionBody.from_bytes(Buffer.from(txBodyHash, 'hex'))) as TransactionBody
  
  const txHash = await hash_transaction(txBody);
  // const witnesses = await TransactionWitnessSet.new();
  
  // add keyhash witnesses
  // const vkeyWitnesses = await Vkeywitnesses.new();
  // const vkeyWitness = await make_vkey_witness(txHash, keyHashes);
  // await vkeyWitnesses.add(vkeyWitness);
  // await witnesses.set_vkeys(vkeyWitnesses);
  
  
  // create the finalized transaction with witnesses
  // const transaction = Transaction.new(
  //     txBody,
  //     witnesses,
  //     await txBody.auxiliary_data(), // transaction metadata
  // );
  
  const witnessSet = await signTx(
    txHash,
    keyHashes,
    password,
    accountIndex
  );
  
  // const transaction = (await Transaction.new(
  //   txBody,
  //   witnessSet,
  //   undefined
  // )) as Transaction;

  const transaction = await createTransaction(txBody, witnessSet);
  var txCbor = Buffer.from(await transaction.to_bytes()).toString('hex');  
  const txHashResult = await submitTx(txCbor)

  return txHashResult;
};


  const handleAccept = useCallback(
    async () => {

  const { id, params } = currentProposal.current;
  const { requiredNamespaces, relays } = params;
  const network = getNetwork();
  const existingWallet = getCurrentAccount();

  // var relay = currentProposal.params.relays[0];
  // var requiredNamespaces = currentProposal.params.requiredNamespaces;
  
  // dispatch({
  //   type: 'changeOfflineMessageVisibility',
  //   status: { offlineMessage: {visible: true} }
  // });
  
  if (currentProposal) {
      dispatch({
        type: 'changeLoadingScreenVisibility',
        status: { loadingScreen: {visible: true, useBackgroundImage: false, opacity: 0.95} }
      });
      clearTimeout(userAcceptanceTimeout.current);
      const namespaces: SessionTypes.Namespaces = {};
      Object.keys(requiredNamespaces).forEach(key => {
        const accounts: string[] = [];
        var address = "";
        if (existingWallet !== undefined) {
          address = existingWallet[network?.id]?.paymentAddr as string;
        }
        
        // console.log("ADDRESSSSS: " + address);
        requiredNamespaces[key].chains?.map((chain: any) => {
          accounts.push(`${chain}:${address}`);
        });
        // console.log(accounts)
        namespaces[key] = {
          accounts,
          methods: requiredNamespaces[key].methods,
          events: requiredNamespaces[key].events,
        };
      });

      await web3wallet.approveSession({
        id,
        namespaces
      });

    setModalVisible(false);
    // setCurrentWCURI("");
    // setCurrentProposal({} as SignClientTypes.EventArguments["session_proposal"]);
    // setSuccessfulSession(true);
      
    dispatch({
      type: 'changeLoadingScreenVisibility',
      status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
    });

    setTimeout(() => {
      BackHandler.exitApp();
    }, 500);

    // dispatch({
    //   type: 'changeOfflineMessageVisibility',
    //   status: { offlineMessage: {visible: false} }
    // });

    // setTimeout(() => {
    //   BackHandler.exitApp();
    // }, 2000);
    
  }


      // console.log("ID: " + id)
      // console.log("Relay: " + relay)
      // console.log("Namespace: " + requiredNamespaces)

      // await web3wallet.approveSession({
      //   id,
      //   relayProtocol: relay.protocol,
      //   namespaces,
      // });
    }, [dispatch, currentProposal])


const onCorrectPassword = (e: any) => {
  clearTimeout(savedPasswordTimeoutId);
  const timeoutId = setTimeout(() => {
      setPassword("");
      setValidPassword(false);
  }, 10000);
  setMessage("");
  setPasswordModalVisible(false);
  // setSigningModalVisible(true);
  setValidPassword(true);
  setSavedPasswordTimeoutId(timeoutId);
};
  
function onFailure(e: any) {
  // Toast.show({
  //   type: 'error',
  //   text1: 'transaction could not be sent \n',
  //   // text2: 'This is some something 👋'
  // });
  let message: string = e?.info ?? e?.toString() ?? "fatal error";
  if (e.message?.indexOf("ValueNotConservedUTxO") >= 0) {
    message = "Error: UTxO already spent."
  }
  setMessage(message);
}

async function onReject() {
  if (requestEvent) {
     const {id, topic} = requestEvent;

     dispatch({
      type: 'changeLoadingScreenVisibility',
      status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
     });

     if (!id)
     {
      return;
     }

     // const response = rejectEIP155Request(requestEvent);
     const respones = formatJsonRpcError(id, getSdkError("USER_REJECTED").message); 
     
    //rejectSession
    await web3wallet.respondSessionRequest({
      topic: topic,
      response: respones
    });
    
    setSigningModalVisible(false);

    setTimeout(() => {
      BackHandler.exitApp();
    }, 500);

    // const requestMetadata: SignClientTypes.Metadata = requestSession?.peer?.metadata;
    
    // handleDeepLinkRedirect(requestMetadata?.redirect);
  }
}

useEffect(() => {
    if (signingModalVisible && !validPassword) {
        setPasswordModalVisible(true);
    }
}, [signingModalVisible])

async function handleReject(message = "USER_REJECTED_METHODS") {
  clearTimeout(userAcceptanceTimeout.current);
  dispatch({
    type: 'changeLoadingScreenVisibility',
    status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
  });

  if (currentProposal) {
    const { id } = currentProposal.current;
   
    await web3wallet.rejectSession({
      id,
      reason: {code: 1,  message: message},//getSdkError("USER_REJECTED_METHODS"),
    });

    setModalVisible(false);
    // setCurrentWCURI("");
    // setCurrentProposal({} as SignClientTypes.EventArguments["session_proposal"]);
    // const requestMetadata: SignClientTypes.Metadata = requestSession?.peer?.metadata;
    
    // handleDeepLinkRedirect(requestMetadata?.redirect);
    setTimeout(() => {
      BackHandler.exitApp();
    }, 500);
  }
}
    const theme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: isDarkMode ? Colors.darker : Colors.lighter
        },
      };


    return <>
    
    <View style={{position: 'absolute'}} >
        <PairingModal
        handleAccept={handleAccept}
        handleReject={handleReject}
        visible={modalVisible}
        setModalVisible={setModalVisible}
        currentProposal={currentProposal.current}
      />
      <Modal
                  animationType="fade"
                  transparent={true}
                  visible={passwordModalVisible}
                  onRequestClose={() => {
                    setPasswordModalVisible(false);
                  }}>
                    <View style={[{position: 'absolute', top:0, left: 0, right: 0, bottom: 0}, isDarkMode ? {backgroundColor: Colors.darker, opacity: 0.9} : {backgroundColor: Colors.darker, opacity: 0.5}]}></View>
                  <View style={[styles.centeredView,]}>
                    <View style={[styles.modalView, isDarkMode ? {backgroundColor: '#353535'} : {backgroundColor: Colors.lighter}]}>
                      <SafeAreaView style={{alignItems: 'center'}}>
                        <Text style={[styles.sectionTitle, {fontSize: 22}]}>Enter wallet password</Text>
                        <TextInput
                          style={styles.input}
                          onChangeText={(newPassword: string) => {setPassword(newPassword);}}
                          value={password}
                          placeholder="password"
                          secureTextEntry={true}
                        />
                          <View style={{flexDirection: 'row'}}>
                            <TouchableOpacity
                              style={[styles.buttons, styles.buttonClose]}
                              onPress={async () => { setMessage(""); setPassword(""); setPasswordModalVisible(false); onReject();}}
                              >
                              <Text style={[styles.textStyle, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.buttons, styles.buttonClose, password.length < 8 ? {backgroundColor: "#c0c0c0"}: {}]}
                              // onPress={() => {setModalVisible(!modalVisible); navigation.navigate('SeedGenerator')}}
                              onPress={() => {password.length >= 8 && requestAccountKey(password, 0).then(onCorrectPassword).catch(onFailure);}}
                              >
                              <Text style={[styles.textStyle, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>Unlock Wallet</Text>
                            </TouchableOpacity>
                            </View>
                            <Text style={[styles.textStyle, isDarkMode ? {color: Colors.light} : {color: Colors.darker}]}>{message}</Text>
                            </SafeAreaView>
                          </View>
                  </View>
                </Modal>
      <SigningModal
        ref={signingModalRef}
        visible={signingModalVisible}
        setModalVisible={setSigningModalVisible}
        requestEvent={requestEvent}
        requestSession={requestSession}
        password={password}
      />
      </View>
      <View>
      </View>
    </>

}