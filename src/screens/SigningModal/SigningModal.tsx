import { Alert, BackHandler, Button, Image, Modal, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SignClientTypes } from "@walletconnect/types";
import { Address, Transaction, TransactionBody, TransactionWitnessSet, hash_transaction } from "@emurgo/react-native-haskell-shelley";
import { getCurrentAccount, getNetwork } from "../../services/ApiConnectorService";
import { ErrorResponse, JsonRpcResponse, JsonRpcError, formatJsonRpcResult, formatJsonRpcError } from "@walletconnect/jsonrpc-utils";
import { web3wallet } from "../../services/Web3WalletClientService";
import { Buffer } from "buffer";
import { Ref, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { getSdkError } from "@walletconnect/utils";
import { Colors } from "react-native/Libraries/NewAppScreen";
import React from "react";
import { useStateValue } from "../../hooks/StateProvider";
import { signTx } from "../../utils/WalletUtils";

interface SigningModalProps {
  visible: boolean;
  setModalVisible: (arg1: boolean) => void;
  requestSession: any;
  requestEvent: SignClientTypes.EventArguments["session_request"] | undefined;
  password: string;
}

export default forwardRef<{waitForResponse: () => Promise<JsonRpcResponse>}, SigningModalProps>(function SigningModal({
  visible,
  setModalVisible,
  requestEvent,
  requestSession,
  password
}: SigningModalProps, ref: Ref<{waitForResponse: () => Promise<JsonRpcResponse>}>) {
  // CurrentProposal values
  useImperativeHandle(ref, () => ({ waitForResponse }));
  const isDarkMode = useColorScheme() === 'dark';
  const [{ initialLoadingReducer }, dispatch] = useStateValue();

  const userResponsed = useRef(false);
  const response = useRef<JsonRpcResponse>();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    modalContentContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 34,
      borderWidth: 1,
      width: "100%",
      height: "50%",
      position: "absolute",
      backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
      // marginBottom: 100,
      bottom: 0,
    },
    dappLogo: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginVertical: 4,
    },
    marginVertical8: {
      marginVertical: 8,
    },
    subHeading: {
      textAlign: "center",
      fontWeight: "600",
    },
  });

  if (!requestEvent || !requestSession) return null;

  async function waitForResponse() {
    response.current = formatJsonRpcError(requestEvent?.id ?? 0, getSdkError("USER_REJECTED").message);
    return new Promise<JsonRpcResponse>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
          resolve(response.current ?? formatJsonRpcError(requestEvent?.id ?? 0, getSdkError("USER_REJECTED").message));
      }, 30000);
       while (!userResponsed.current) {
          await new Promise<void>((resolveTimeout, _) => {
              setTimeout(() => {
                resolveTimeout();
              }, 1000)
          });
       }
      clearTimeout(timeout);
      userResponsed.current = false;

      return resolve(response.current ?? formatJsonRpcError(requestEvent?.id ?? 0, getSdkError("USER_REJECTED").message));
    });
  }

  useEffect(() => {
    if (!requestEvent || !requestEvent?.params?.request) {
      return;
    }
    const updateMessage = async ()=> {
      const {request} = requestEvent?.params;
      const {id} = requestEvent;
      var unsignedTx = request?.params[0];
                
      const tx = await Transaction.from_hex(unsignedTx);
      var txBody = await tx?.body();
      var txBodyHash = "";
      if (txBody != undefined)
      {
        txBodyHash = Buffer.from(await txBody.to_bytes()).toString("hex");
        const outputs = await txBody.outputs();
        const outt = await outputs.to_json() as string;
        const utxos = JSON.parse(outt);
        setMessageInfo("\n Paying " + Number(utxos[0]["amount"]["coin"]) / 1000000 + " ADA to \n" + utxos[0]["address"] + "\n");
      }
    }
    updateMessage();
  }, [requestEvent]);

  const chainID = requestEvent?.params?.chainId?.toUpperCase();
  const method = requestEvent?.params?.request?.method;
  // const message = getSignParamsMessage(requestEvent?.params?.request?.params);

  const requestName = requestSession?.peer?.metadata?.name;
  const requestIcon = requestSession?.peer?.metadata?.icons[0];
  const requestURL = requestSession?.peer?.metadata?.url;
  const [messageInfo, setMessageInfo] = useState("");
  const existingWallet = getCurrentAccount();
  let network = getNetwork();
  const { topic } = requestEvent;

  const createTransaction = async (txBody: TransactionBody, witnessSet: TransactionWitnessSet) => {
    const transaction = (await Transaction.new(
      txBody,
      witnessSet,
      undefined
    )) as Transaction;
    
    return transaction;
  }

  async function onApprove() {
    if (requestEvent) {
      // const response = await approveEIP155Request(requestEvent);
      // await web3wallet.respondSessionRequest({
      //   topic,
      //   response,
      // });

          const {request} = requestEvent.params;
          const {id} = requestEvent;
          var unsignedTx = request?.params[0];
                    
          const tx = await Transaction.from_hex(unsignedTx);
          var txBody = await tx?.body();
          var txBodyHash = "";
          if (txBody != undefined)
          {
            txBodyHash = Buffer.from(await txBody.to_bytes()).toString("hex");
            // const outputs = await txBody.outputs();
            // const outt = await outputs.to_json() as string;
            // const utxos = JSON.parse(outt);            
          }
          
          var txCbor = "";
          var witnessSetCbor = "";

          var paymentKeyHash = "";
        if (existingWallet !== undefined) {          
          paymentKeyHash = existingWallet.paymentKeyHash;
        }

          const txHash = await hash_transaction(await tx?.body() as TransactionBody);
          if (txBodyHash && txBody) {
            var signedWitnessSet = await signTx(
              txHash,
              [paymentKeyHash],
              password,
              0
            );
            // console.log("BBBB: ");
            const signedTransaction = await createTransaction(txBody, signedWitnessSet);
            txCbor = Buffer.from(await signedTransaction.to_bytes()).toString('hex');  
            witnessSetCbor = Buffer.from(await signedWitnessSet.to_bytes()).toString('hex');  
          }
          
          response.current = 
            {
              id,
              jsonrpc: "2.0",
              result: witnessSetCbor
            }

      // await web3wallet.respondSessionRequest({response: response, topic: topic});     
       setModalVisible(false);

      // dispatch({
      //   type: 'changeLoadingScreenVisibility',
      //   status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
      // });
       
      userResponsed.current = true;
      // setTimeout(() => {
      //   BackHandler.exitApp();
      // }, 500);
    }
  }

  async function onReject() {
    if (requestEvent) {
      const {id, topic} = requestEvent;

    //  dispatch({
    //   type: 'changeLoadingScreenVisibility',
    //   status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
    //  });

     if (!id)
     {
      return;
     }

      setModalVisible(false);
      
    //  dispatch({
    //    type: 'changeLoadingScreenVisibility',
    //    status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.95} }
    //  });


      // const response = rejectEIP155Request(requestEvent);
      response.current = formatJsonRpcError(id, getSdkError("USER_REJECTED").message);
      //rejectSession
      // await web3wallet.respondSessionRequest({
      //   topic: topic,
      //   response: response
      // }); 
    // response.current = false;   
    userResponsed.current = true;
      // setTimeout(() => {
      //   BackHandler.exitApp();
      // }, 500);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.modalContentContainer}>
          <Image
            style={styles.dappLogo}
            source={{
              uri: requestIcon,
            }}
          />

          <Text>{requestName}</Text>
          <Text>{requestURL}</Text>

          <Text style={{textAlign: "center"}}>{messageInfo}</Text>

          <Text>Chains: {chainID}</Text>

          <View style={styles.marginVertical8}>
            <Text style={styles.subHeading}>Method:</Text>
            <Text>{method}</Text>
          </View>

          <View style={{ display: "flex", flexDirection: "row" }}>
            <Button onPress={() => onReject()} title="Cancel" />
            <Button onPress={() => onApprove()} title="Accept" />
          </View>
        </View>
      </View>
    </Modal>
  );
});

