import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Modal, SafeAreaView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import AvatarBox from "../components/AvatarBox";
import { useStateValue } from "../hooks/StateProvider";
import { CreateAccountScreen } from "./CreateAccountScreen";
import { CreateTransactionScreen } from "./CreateTransactionScreen";
import { HomeScreen } from "./HomeScreen";
import { SeedGeneratorScreen } from "./SeedGeneratorScreen";
import { SuccessWalletCreatedScreen } from "./SuccessWalletCreatedScreen";
import { makeStyles } from "../../style";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { web3wallet } from "../utils/Web3WalletClient";
import { APIError, ERROR, NETWORK_ID, TxSendError } from "../config/config";
import { getCurrentAccount, getNetwork, getUtxos, isValidAddress } from "../services/NetworkDataProviderService";
import { blockfrostRequest } from "../utils/ApiExtensions";
import { Address, Transaction, TransactionBody, TransactionUnspentOutput, TransactionWitnessSet, hash_transaction } from "@emurgo/react-native-haskell-shelley";
import { signTx } from "../utils/Ledger";
import { SignClientTypes, SessionTypes } from "@walletconnect/types";
import { ErrorResponse, JsonRpcResponse, formatJsonRpcError } from "@walletconnect/jsonrpc-utils";
import PairingModal from "./PairingModal/PairingModal";
import SigningModal from "./SigningModal/SigningModal";
import { Buffer } from "buffer";
import { getSdkError } from "@walletconnect/utils";
import React from "react";
import { requestAccountKey } from "../utils/WalletServiceProvider";
import Toast from "react-native-toast-message";


export const LayoutNew = () => {
  const netInfo = useNetInfo();
  const Stack = createNativeStackNavigator();
  // const isDarkMode = useColorScheme() === 'dark';
  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);
  const [{ initialLoadingReducer }, dispatch] = useStateValue();

  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected == initialLoadingReducer.status.offlineMessage.visible) {
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

  const onSuccess = (e: any) => {
    Linking.openURL(e.data).catch(err =>
      console.error('An error occured', err)
    );
  };
  
  const onSessionProposal = useCallback(
    async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      console.log("proposal:----->");      
      setCurrentProposal(proposal);
      setModalVisible(true);
      // setCurrentProposal(proposal);
    },
    []
  );
  const existingWallet = getCurrentAccount();
  let network = getNetwork();
  const [modalVisible, setModalVisible] = useState(false);
  const [savedPasswordTimeoutId,setSavedPasswordTimeoutId] = useState({} as NodeJS.Timeout);
  const [signingModalVisible, setSigningModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [successfulSession, setSuccessfulSession] = useState(false);

  const [currentWCURI, setCurrentWCURI] = useState("");
  const [password, setPassword] = useState("");
  const [validPassword, setValidPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [currentProposal, setCurrentProposal] = useState({} as SignClientTypes.EventArguments["session_proposal"]);

  const [requestSession, setRequestSession] = useState({} as any);
  const [requestEvent, setRequestEvent] = useState({} as SignClientTypes.EventArguments["session_request"] | undefined);
  const [url, setUrl] = useState("");

  const openDeepLink = (urlPara = "") => {
    urlPara = urlPara != "" ? urlPara : url;
    if (!urlPara) {
      return;
    }
    Linking.canOpenURL(urlPara!).then(async (supported) => {      
      if (supported) {
        
        // event.url = ""
        
        // Object.values(web3wallet.getActiveSessions()).map(async (session: any) => console.log(await session.topic))
        var activeSessions = await web3wallet?.getActiveSessions();
        
        // console.log(activeSessions);
        if (activeSessions) {
          Object.keys(activeSessions).map(async (topic: string) => {
            console.log("Session: ")
            console.log(topic)
            // await web3wallet.disconnectSession({
            //   topic: topic,
            //   reason: {code: 0,  message: "USER DISCONNECTED"},
            // });
          })
        }
        
        var splitUrl = urlPara!.split("@");
        var topic = "";
        if (splitUrl.length > 1)
        {
          topic = splitUrl[0].slice(3);
        }

        var pairings = web3wallet.core.pairing.getPairings();
        pairings.map((pair: any) => {
          //web3wallet.core.pairing.disconnect({topic: pair.topic});
        })
        var existingPairing = pairings.find((pair: any) => {
          return pair.topic == topic;
        });

        if (existingPairing == undefined) {
          // if (pairings.length == 0) {
            console.log("NEW PAIRING")
            console.log(topic)
            var pairing = await web3wallet.core.pairing.pair({ uri: urlPara! });
          // }              
        }
        else {
          console.log("ALREADY PAIRED")
          console.log(topic)
        }
      }   
    });
  }

  useEffect(() => {
    
    if (web3wallet)
    {
      web3wallet.on("session_proposal", onSessionProposal);
      web3wallet.on("session_request", onSessionRequest);
    }
    if (url) {
      openDeepLink()
    }

    Linking.addEventListener("url", (event) => {
      openDeepLink(event.url);
    });
    return () => {
      // subscription.remove();
      Linking.removeAllListeners('url');
    }
   

  }, [web3wallet]);

  
  const onSessionRequest = useCallback(
    async (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      const { id, topic, params } = requestEvent;
      const { request } = params;
      const requestSessionData = web3wallet.engine.signClient.session.get(topic);
        
        var response: JsonRpcResponse = 
        {
          id,
          jsonrpc: "2.0",
          result: ""
        }
        var lovelace = "";
        var myAddress = "";
        var paymentKeyHash = "";
        if (existingWallet !== undefined) {
          lovelace = ((existingWallet[network.id]?.lovelace) as string);
          const adr = await ((await Address.from_bech32(existingWallet[network.id]?.paymentAddr as string)) as Address).to_bytes();
          myAddress = Buffer.from(adr).toString('hex');
          paymentKeyHash = existingWallet.paymentKeyHash;
        }
        
      console.log("SESSION_REQUEST: " + request.method)
      request.params?.map((para : any) => {
        console.log(para)
      })
        
      switch (request.method) {
        case "cardano_getBalance":
          response = 
            {
              id,
              jsonrpc: "2.0",
              result: lovelace
            }
          break;
        case "cardano_signTx":
            setRequestEvent(requestEvent);
            setRequestSession(requestSessionData);
            // if (!validPassword) {
            //    setPasswordModalVisible(true);
            // } else {
               setSigningModalVisible(true);
            // }           
            
          return;
        case "cardano_getNetworkId":
            response = 
              {
                id,
                jsonrpc: "2.0",
                result: network.id
              }
            break;
        case "cardano_submitTx":
          var signedTxCbor = request.params[0];

          const txHashResult = await submitTx(signedTxCbor)

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
            
            response = 
              {
                id,
                jsonrpc: "2.0",
                result: _utxosHashes
              }
            break;
        case "cardano_getUsedAddresses":
          console.log("MY ADDRESS: " + myAddress);
          response = 
            {
              id,
              jsonrpc: "2.0",
              result: [myAddress]
            }
          break;
        case "cardano_getUnusedAddresses":
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

     

        // console.log(request.params);
        
        // case EIP155_SIGNING_METHODS.ETH_SIGN:
        // case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
        //   setRequestSession(requestSessionData);
        //   setRequestEventData(requestEvent);
        //   setSignModalVisible(true);
        
        
        
        await web3wallet.respondSessionRequest({response: response, topic: topic});
        BackHandler.exitApp();
    },
    [password, validPassword]
  );

const submitTx = async (tx: any) => {
  const network = await getNetwork();
  
  var submitUrl: string | undefined = undefined;
  if (network.id === NETWORK_ID.mainnet) {
    submitUrl = network.mainnetSubmit;
  } else if (network.id === NETWORK_ID.preprod) {
    submitUrl = network.preprodSubmit;
  } else if (network.id === NETWORK_ID.preview) {
    submitUrl = network.previewSubmit;
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

async function handleAccept() {
  const { id, params } = currentProposal;
  const { requiredNamespaces, relays } = params;

  // var relay = currentProposal.params.relays[0];
  // var requiredNamespaces = currentProposal.params.requiredNamespaces;
      
  if (currentProposal) {
    const namespaces: SessionTypes.Namespaces = {};
      Object.keys(requiredNamespaces).forEach(key => {
        const accounts: string[] = [];
        var address = "";
        if (existingWallet !== undefined) {
          address = existingWallet[network.id]?.paymentAddr as string;
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
      relayProtocol: relays[0].protocol,
      namespaces,
    });

    setModalVisible(false);
    setCurrentWCURI("");
    setCurrentProposal({} as SignClientTypes.EventArguments["session_proposal"]);
    setSuccessfulSession(true);
    BackHandler.exitApp();
  }


      // console.log("ID: " + id)
      // console.log("Relay: " + relay)
      // console.log("Namespace: " + requiredNamespaces)

      // await web3wallet.approveSession({
      //   id,
      //   relayProtocol: relay.protocol,
      //   namespaces,
      // });
}

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
    BackHandler.exitApp();
  }
}

useEffect(() => {
    if (signingModalVisible && !validPassword) {
        setPasswordModalVisible(true);
    }
}, [signingModalVisible])

async function handleReject() {
  

  if (currentProposal) {
    const { id } = currentProposal;
    await web3wallet.rejectSession({
      id,
      reason: {code: 1,  message: "USER_REJECTED_METHODS"},//getSdkError("USER_REJECTED_METHODS"),
    });

    setModalVisible(false);
    setCurrentWCURI("");
    setCurrentProposal({} as SignClientTypes.EventArguments["session_proposal"]);
    BackHandler.exitApp();
  }
}


    const theme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: isDarkMode ? Colors.darker : Colors.lighter
        },
      };
      useEffect(() => {        
        Linking.addEventListener("url", (event) => {
          openDeepLink(event.url);
        });
        return () => {
          // subscription.remove();
          // Linking.removeAllListeners('url');
        }
      }, [])
    return (
      <>
       <View style={[initialLoadingReducer.status.offlineMessage.visible ? {display: 'flex'} : {display: 'none'}, {left:0, right:0 , height: 64, backgroundColor: Colors.darkred, position: "absolute", zIndex: 15, alignItems: 'center', justifyContent: 'center'}]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <ActivityIndicator size="small" color={Colors.lighter} />
            <Text style={{color: Colors.lighter, paddingLeft: 12}}>You are offline</Text>
          </View>
          <Text style={{color: Colors.lighter, fontSize: 12}}>waiting to come back online</Text>
        </View>
        <View style={[initialLoadingReducer.status.loadingScreen.visible ? {display: 'flex'} : {display: 'none'}, {position: 'absolute', zIndex: 10, bottom: 0, right:0, top: 0, left:0, alignSelf:"stretch", borderColor: '#111', borderStyle: "solid", alignItems:'center', justifyContent: 'center', backgroundColor: '#111'}]}>
          <Image source={require('../assets/spacebudz_bg.png')} style={{position: 'absolute', resizeMode: "contain", opacity: 0.6, flex: 1}}/>
          {/* <SimpleLottie /> */}
          {/* <AvatarBox avatarRadnomNumber='undefined' smallRobot={false} width={150}></AvatarBox> */}
          
          <ActivityIndicator size="large" color={Colors.lighter} />
          <Text style={{fontSize: 16, color: Colors.lighter}}>NamiNative</Text>
          
        </View>
        {
        netInfo.isConnected !== null ?
        <NavigationContainer theme={theme} linking={{
          prefixes: ['wc:'],
          config: {
            screens: {
              HomeScreen: '',
            },
          },
          // subscribe(listener) {
          //   const subscription = Linking.addEventListener('url', (event) => {
          //     console.log("YYYY")
          //     Linking.canOpenURL(event.url).then(async (supported) => {
          //         if (supported) {
          //           console.log(supported);
          //           console.log(event.url);
          //           // event.url = ""
          //           console.log("######################");
          //           // Object.values(web3wallet.getActiveSessions()).map(async (session: any) => console.log(await session.topic))
          //           var activeSessions = await web3wallet?.getActiveSessions();
                    
          //           // console.log(activeSessions);
          //           console.log("######################");
          //           if (activeSessions) {
          //             Object.keys(activeSessions).map(async (topic: string) => {
          //               // console.log("JAA");
          //               console.log(topic);
                        
          //               // await web3wallet.disconnectSession({
          //               //   topic: topic,
          //               //   reason: {code: 0,  message: "USER DISCONNECTED"},
          //               // });
          //             })
          //           }
                    
          //           var splitUrl = event.url.split("@");
          //           var topic = "";
          //           if (splitUrl.length > 1)
          //           {
          //             topic = splitUrl[0].slice(3);
          //           }
      
          //           var pairings = web3wallet.core.pairing.getPairings();
          //           pairings.map((pair) => {
          //             //web3wallet.core.pairing.disconnect({topic: pair.topic});
          //           })
          //           var existingPairing = pairings.find((pair) => {
          //             return pair.topic == topic;
          //           });
      
          //           if (existingPairing == undefined) {
          //             // if (pairings.length == 0) {
          //               console.log("NEW PAIRING")
          //               console.log(topic)
          //               var pairing = await web3wallet.core.pairing.pair({ uri: event.url });
          //             // }              
          //           }
          //           else {
          //             console.log("ALREADY PAIRED")
          //             console.log(topic)
          //           }
          //         }
          //     });
          // });
          async getInitialURL() {
            // Check if app was opened from a deep link
            const url = await Linking.getInitialURL();            
            if (url != null) {
              setUrl(url);
              return url;
            } 
          // return () => {
          //   // Clean up the event listeners
          //   subscription.remove();
          // };     
           },
        }}>
        <Stack.Navigator>
          
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'NamiNative', headerShown: false}}
        
        />
        {/* <Stack.Screen name="Profile" component={ProfileScreen} /> */}
        <Stack.Screen name="SeedGenerator"  options={{title: "", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={SeedGeneratorScreen} />
        <Stack.Screen name="CreateAccount" options={{title: "", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={CreateAccountScreen} />
        <Stack.Screen name="SuccessWalletCreated" options={{title: "", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={SuccessWalletCreatedScreen} />
        <Stack.Screen name="CreateTransaction" options={{title: "New Transaction", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={CreateTransactionScreen} />
        
      </Stack.Navigator>
      <View style={{position: 'absolute'}} >
        <PairingModal
        handleAccept={handleAccept}
        handleReject={handleReject}
        visible={modalVisible}
        setModalVisible={setModalVisible}
        currentProposal={currentProposal}
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
        visible={signingModalVisible}
        setModalVisible={setSigningModalVisible}
        requestEvent={requestEvent}
        requestSession={requestSession}
      />
      </View>
      <View>      
      
      
      </View>
    </NavigationContainer>
    :
    <></>
    }
    </>
    );
}