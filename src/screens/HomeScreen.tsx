// import AsyncStorage from '@react-native-async-storage/async-storage';
import {  Stack } from '@react-native-material/core';
import { Buffer } from "buffer";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// @ts-expect-error
import { Backpack } from 'react-kawaii/lib/native/';

import {
  Alert,
    AppState,
    Image,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
  } from 'react-native';
import { Checkbox, IconButton } from 'react-native-paper';
import  { SvgXml } from 'react-native-svg';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { calculateAmount, compileOutputs, fromAssetUnit, getCurrentAccount, getCurrentAccountIndex, getDelegation, getNetwork, getTransactions, setTxDetail, updateBalance, updateTxInfo } from '../services/NetworkDataProviderService';
import { AccountInfo, NetworkDefaultStats } from '../types/Network';
import AvatarBox from '../components/AvatarBox';
import { useStateValue } from '../hooks/StateProvider';
import QrCode from '../components/QrCode';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { updateAccount } from '../utils/Wallet';
import { TransactionsList } from '../components/TransactionsList';
import React from 'react';
import AssetFingerprint from '@emurgo/cip14-js';
import provider from '../config/provider';
import PushNotification from 'react-native-push-notification';
import { dateFromUnix } from '../utils/Common';
import { Wallet } from '../storage/Wallet';
import { makeStyles } from '../../style';
import { useNetInfo } from '@react-native-community/netinfo';
import QrScannerScreen from './QrScannerScreen/QrScannerScreen';

export const HomeScreen = ({navigation, route}: any) => {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);
  
  // const netInfo = useNetInfo();
  
  // const isDarkMode = useColorScheme() === 'dark';
  // const svg = avatar.toString();
  // const styles = StyleSheet.create({
  //   container: {
  //     alignItems: 'center',      
  //   },
  //   buttons: {
  //     // backgroundColor: '#2a2a2a',
  //     padding: 10,
  //     margin: 5,
  //     borderRadius: 6,   
  //     alignItems: 'center'
  //   },
  //   addButton: {
  //     alignSelf: 'flex-end',
  //     position: 'absolute',
  //     borderRadius: 50,
  //     backgroundColor: '#61DDBC',
  //     color: '#fff',
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //     width: 64,
  //     height: 64,
  //     right: 35,
  //     bottom: 35,
  //     zIndex: 10
  //   },
  //   centeredView: {
  //     flex: 1,
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //     marginTop: 22,
  //   },
  //   modalView: {
  //     margin: 20,
  //     backgroundColor: isDarkMode ? Colors.dark : Colors.lighter,
  //     borderRadius: 20,
  //     padding: 35,
  //     alignItems: 'center',
  //     shadowColor: '#000',
  //     shadowOffset: {
  //       width: 0,
  //       height: 2,
  //     },
  //     shadowOpacity: 0.25,
  //     shadowRadius: 4,
  //     elevation: 5,
  //   },
  //   button: {
  //     borderRadius: 20,
  //     padding: 10,
  //     elevation: 2,
  //   },
  //   buttonOpen: {
  //     backgroundColor: '#61DDBC',
  //   },
  //   buttonClose: {
  //     backgroundColor: '#61DDBC',
  //   },
  //   textStyle: {
  //     color: 'white',
  //     fontWeight: 'bold',
  //     textAlign: 'center',
  //   },
  //   modalText: {
  //     marginBottom: 15,
  //     textAlign: 'center',
  //   },
    
  //   sectionTitle:
  //   {
  //     color: isDarkMode ? Colors.light : Colors.dark
  //   },

  //   backgroundTheme:
  //   {
  //     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter
  //   },

  //   autocompleteContainer: {
  //     flex: 1,
  //     left: 0,
  //     position: 'absolute',
  //     right: 0,
  //     top: 0,
  //     zIndex: 1
  //   }
  // });

  const [appState, setAppState] = useState(AppState.currentState);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  async function updateTransactions(initialUpdate: boolean = false) {
    
    const network = await getNetwork();
    var existingWallet = getCurrentAccount() as AccountInfo;
    
    const trans = new Array<{
      id: string,
      txHash: string,
      lovelace: bigint,
      date:  Date,
      type: any
    } >();

    if (existingWallet === undefined) {
      return Promise.resolve(trans);
    }
        
    

    await Promise.all((existingWallet[network.id] as NetworkDefaultStats)?.history?.confirmed.map(async (txHash: string) => {
      if (txHash == "") {
        return Promise.resolve(trans);
      }
      
      let date = existingWallet[network.id]?.history?.details[txHash]?.date;
      
      var newTransaction = false;
      if (typeof existingWallet[network.id]?.history?.details[txHash] !== 'object' || Object.keys(existingWallet[network.id]?.history?.details[txHash]).length < 4) {
        let detail = await updateTxInfo(txHash, initialLoadingReducer.status.offlineMessage.visible);
        existingWallet = await setTxDetail(txHash, detail) as AccountInfo;
        date = dateFromUnix(detail.block.time);
        // console.log ("DATE2");
        // console.log(date);
        // (existingWallet[network.id]?.history?.details[txHash] as any).date = date;
        newTransaction = true;
      } else {
        date = dateFromUnix(existingWallet[network.id]?.history?.details[txHash]?.block?.time);
      }
      
      const type = await getTxType(existingWallet[network.id]?.paymentAddr, existingWallet[network.id]?.history?.details[txHash]?.utxos);
      // const date = existingWallet[network.id]?.paymentAddr, existingWallet[network.id]?.history?.details[txHash].
      const amounts: any = await calculateAmount(existingWallet[network.id]?.paymentAddr, existingWallet[network.id]?.history?.details[txHash]?.utxos)
      const lovelace = BigInt(
          await amounts?.find((amount: any) => amount?.unit === 'lovelace')?.quantity ?? 0
      );
      
      const transactionInformation = {
          id: txHash,
          txHash: txHash,
          lovelace: lovelace,
          date:  date,
          type: type
        }             
        // console.log("initialUpdate")
        // console.log(initialUpdate)
        // console.log("newTransaction")
        // console.log(newTransaction)
        // console.log("existingWallet")
        // console.log(existingWallet)
        if (transactions.find(trans => {
          return trans.txHash == txHash
        }) == undefined) {
          setTimeout(() => {
            if (!initialUpdate && newTransaction && existingWallet[network.id]?.lastUpdate && existingWallet[network.id]?.history?.confirmed[0] == existingWallet[network.id]?.lastUpdate)
            {
              PushNotification.localNotification({
                title: transactionInformation.type == "SELF" ? 'Self transaction' : transactionInformation.type == "IN" ? 'Incoming transaction' : 'Outgoing transaction',
                message: `Validated on ${transactionInformation.date.toLocaleString()} [${transactionInformation.txHash}]`,
                playSound: true,
                soundName: Platform.OS === 'android'
                ? 'default' //android.resource://com.rnfirebasenotification/raw/mint
                : 'default', // *.wav
                channelId: "1"
              });
            }
          }, 2000)
          
          trans.push(transactionInformation);
        }
    }))
    
    // await updateAccount(existingWallet, false, netInfo.isConnected === null || !netInfo.isConnected);
    return Promise.resolve(trans);
}


  

  const [transactions, setTransactions] = useState([] as Array<{
        id: string,
        txHash: any,
        lovelace: any,
        date: any,
        type: any
     }>);

  
    const useIsMounted = () => {
    const isMounted = React.useRef(false);
    React.useEffect(() => {


      // const appStateListener = AppState.addEventListener(
      //   'change',
      //   nextAppState => {
      //     setIsLoading(false);
      //     setAppState(nextAppState);
      //   },
      // );
      // return () => {
      //   appStateListener?.remove();
      // };


      // dispatch({
      //   type: 'changeLoadingScreenVisibility',
      //   status: { loadingScreen: {visible: false} }
      // });
      
      // var existingWallet = getCurrentAccount(); //JSON.parse(((await AsyncStorage.getItem(STORAGE.accounts)) as string)) as AccountSetting;
      // setWalletIsAvailable(existingWallet !== undefined);
//       checkWallet(route.params?.initialWallet);
//       console.log("CHECKWALLET INIT")
// console.log(route.params?.initialWallet)
      isMounted.current = true;
      return () => {isMounted.current = false};
      
    }, []);
    return isMounted;
  };
  const isMounted = useIsMounted();

  const getData = async (forceUpdate: false) => {
    const currentIndex = getCurrentAccountIndex();
    const account = getCurrentAccount() as AccountInfo;
    
    const { avatar, name } = account;
    const { paymentAddr } = account[network.id] as NetworkDefaultStats
    if (!isMounted.current) return;

    await updateAccount(undefined, forceUpdate);
    // const allAccounts = getCurrentAccount() as Account;
    const currentAccount = account;
    (currentAccount[network.id] as NetworkDefaultStats).ft =
      parseInt((currentAccount[network.id] as NetworkDefaultStats).lovelace) > 0
        ? [
            {
              unit: 'lovelace',
              quantity: (
                BigInt((currentAccount[network.id] as NetworkDefaultStats).lovelace) -
                BigInt((currentAccount[network.id] as NetworkDefaultStats).minAda) -
                BigInt(
                  (currentAccount[network.id] as NetworkDefaultStats).collateral
                    ? ((currentAccount[network.id] as NetworkDefaultStats)?.collateral as any).lovelace
                    : 0
                )
              ).toString(),
            },
          ]
        : [];
        (currentAccount[network.id] as NetworkDefaultStats).nft = [];
        (currentAccount[network.id] as NetworkDefaultStats).assets?.forEach((asset: any) => {
      asset.policy = asset.unit.slice(0, 56);
      asset.name = Buffer.from(asset.unit.slice(56), 'hex');
      asset.fingerprint = AssetFingerprint.fromParts(
        Buffer.from(asset.policy, 'hex'),
        asset.name
      ).fingerprint();
      asset.name = asset.name.toString();
      if (
        asset.has_nft_onchain_metadata === true ||
        fromAssetUnit(asset.unit).label === 222
      )
      (currentAccount[network.id] as NetworkDefaultStats).nft?.push(asset);
      else (currentAccount[network.id] as NetworkDefaultStats).ft?.push(asset);
    });
    let price = fiatPrice.current;
    try {
      if (!fiatPrice.current) {
        price = await provider.api.price("usd");
        fiatPrice.current = price;
      }
    } catch (e) {}
    
    const delegation = await getDelegation();
    if (!isMounted.current) return;
  };
  
  const network = getNetwork();
  const [modalVisible, setModalVisible] = useState(false);
  const [checked, setChecked] = useState("unchecked" as "checked" | "unchecked" | "indeterminate");
  const [walletIsAvailable, setWalletIsAvailable] = useState(false);
  const [addr, setAddr] = useState("");
  const [balance, setBalance] = useState(0.00);
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [accountName, setAccountName] = useState("");
  const [{ initialLoadingReducer }, dispatch] = useStateValue();
  const fiatPrice = React.useRef(0);


  function usePrevious(value: boolean) {
    const connectionStatePrev = useRef(false);
    useEffect(() => {
      connectionStatePrev.current = value;
    });
    return connectionStatePrev.current;
  }

  // const connectionStatePrev = useRef(false);
  const connectionStatePrev = usePrevious(initialLoadingReducer.status.offlineMessage.visible);
  useEffect(() => {
      if (connectionStatePrev != initialLoadingReducer.status.offlineMessage.visible && connectionStatePrev) {
        onRefresh(false);
      }
      return () => { 
        // connectionStatePrev = initialLoadingReducer.status.offlineMessage.visible;
      };
  }, [initialLoadingReducer.status.offlineMessage])


  const homeComponent = () => {
    return (
      <>
              <View style={[styles.container, {paddingTop: 50}]}>
              <View>
              {/* <Image source={require('../assets/nami.svg')}></Image> */}
              {/* <Svg height="100" width="100">
                  <Image
                  x="5%"
                  y="5%"
                  width="90%"
                  height="90%"
                  href={Platform.OS === 'web' ? dataUriExample : {uri: dataUriExample}}
                  opacity="1"
                  />
                  
              </Svg>   */}
              <SvgXml xml={dataUriExample} width={100} height={100} fill={"#61DDBC"}  />                
              </View>
              {/* <Image source={{uri:"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMyAyIj4NCjxwYXRoIGZpbGw9IiMwMDk1NDMiIGQ9Im0wLDBoM3YyaC0zeiIvPg0KPHBhdGggZmlsbD0iI2ZiZGU0YSIgZD0ibTAsMmwyLTJoMXYyeiIvPg0KPHBhdGggZmlsbD0iI2RjMjQxZiIgZD0ibTMsMHYyaC0yeiIvPg0KPC9zdmc+DQo="}} style={{width:100,height:100}}/> */}
                
                <Text style={[styles.sectionTitle, {fontSize: 32}]}>Welcome</Text>
                <Text style={[styles.sectionTitle, {fontSize: 16}]}>Let's get started with creating a wallet.</Text>
              </View>
              <View style={{paddingTop: 50}}>
                <Backpack size={120} mood="blissful" color="#61DDBC" />
              </View>
              <View style={{marginTop: 20}}>
              <TouchableOpacity
                  style={[styles.buttons]}
                  onPress={() => setModalVisible(true)}
              >
                  <Text style={[styles.buttons, styles.buttonClose, isDarkMode ? {color: Colors.dark} : {color: Colors.darker}]}>New Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.buttons, isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.darker}]}
                  onPress={() => {navigation.navigate('SeedGenerator', {restoreWallet: true})}}
              >
                  <Text style={[isDarkMode ? {color: Colors.lighter} : {color: Colors.light}, {zIndex: 10}]}>Import</Text>
              </TouchableOpacity>
              </View>
              <Modal
                  animationType="fade"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(!modalVisible);
                  }}>
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={[styles.sectionTitle, styles.modalText]}>
                          Make sure no one is watching the screen, while the seed phrase is
                            visible.
                          </Text>
                          <IconButton icon="eye" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} />
                          <View style={{flexDirection: 'row', alignContent: 'center', justifyContent: 'center', height: 32}}>
                          <Checkbox color={isDarkMode ? Colors.lighter : Colors.dark} uncheckedColor={'#c0c0c0'} status={checked} onPress={() => {setChecked(checked == "checked" ? "unchecked" : "checked")}} />
                          <Text style={[styles.sectionTitle, {alignSelf: 'center'}]}>
                              I accept{' '}
                              {/* <Link
                                onClick={() => termsRef.current.openModal()}
                                textDecoration="underline"
                              > */}
                                Terms of use
                              {/* </Link> */}
                            </Text>
                          </View>
                          <View style={{flexDirection: 'row'}}>
                            <Pressable
                              style={[styles.buttons]}
                              onPress={() => { setChecked("unchecked"); setModalVisible(!modalVisible)}}>
                              <Text style={[styles.textStyle, isDarkMode ? {color: Colors.lighter} : {color: Colors.darker}]}>Close</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.buttons, styles.buttonClose, checked=="unchecked" ? {backgroundColor: "#c0c0c0"} : {}]}
                              onPress={() => {setModalVisible(!modalVisible); setChecked("unchecked"); navigation.navigate('SeedGenerator')}}
                              disabled={checked=="unchecked"}
                              >
                              <Text style={[styles.textStyle, isDarkMode ? {color: Colors.darker} : {color: Colors.darker}]}>Continue</Text>
                            </Pressable>
                          </View>
                    </View>
                  </View>
                </Modal>
          </>
    )
  }
  const [isLoading, setIsLoading] = useState(false);
  
  function reloadScreen() {
    navigation.navigate('Home', {hideLoadingScreen: false});
  }
 
  function onAvatarCreated() {   
  }

  const onRefresh = async (initialUpdate: boolean = false) => {
    
    if (getCurrentAccount() == undefined) {
      return Promise.resolve(true);
    }
    
    setIsLoading(true);
    
    var existingWallet = (await updateAccount(undefined, false, initialLoadingReducer.status.offlineMessage.visible)) as AccountInfo;
    
    if (!initialLoadingReducer.status.offlineMessage.visible)
    {      
      await updateBalance(existingWallet);
    }
    
    var lovelace = parseInt((((existingWallet[network.id] as NetworkDefaultStats)?.lovelace) as string));
    var ada = lovelace <= 100000 ? 0 : lovelace/1000000;
    var decimals = lovelace <= 100000 ? lovelace : lovelace % 1000000;
    var balance = parseFloat(ada.toString() + "." + decimals.toString());      
    let price = fiatPrice.current;
    
    var trans = await updateTransactions(initialUpdate) as any;
    
    // setTransactions([...trans.sort((t1: any, t2: any) => t2.date - t1.date)])
    
    setBalance(balance);
    
    setTransactions([...trans.sort((t1: any, t2: any) => t2.date - t1.date), ...transactions])
      try {
        if (!fiatPrice.current) {
          price = await provider.api.price("usd");
          fiatPrice.current = price;
        }
      } catch (e) {}

      // setTimeout(() => {
        setIsLoading(false);
      // }, 1500);
      
      return Promise.resolve(true)
  };

  const hideScanner = () => {
    setIsScannerVisible(false);
  }

  const showScanner = () => {
    setIsScannerVisible(true);
  }

   const showWalletScreen = useMemo(() => {   
    return (
      <SafeAreaView style={{flex: 1 , backgroundColor: Colors.darker}}> 
        { isScannerVisible ? 
                <View style={[{ position: 'absolute', flex: 1, zIndex: 10,  alignItems: 'center', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.darker}]}>
                  <View style={[{position: 'relative', borderRadius: 6}]}>
                      <QrScannerScreen hideScanner={hideScanner} navigation={navigation} />
                    </View>
                </View>
                 : null
              }
              { walletIsAvailable ?
                <TouchableOpacity
                // style={styles.buttons}
                // onPress={() => {navigation.navigate('SeedGenerator', {restoreWallet: true})}}
                style={[styles.addButton, styles.button, styles.buttonOpen, {borderRadius: 64, borderWidth: 6, backgroundColor: Colors.lighter}, {borderColor: isDarkMode ? Colors.lighter : Colors.light}, {shadowColor: '#000', shadowOffset: {width: -30, height: 55}, shadowRadius: 128, elevation: 10, zIndex: 5}]}
                        onPress={() => {!initialLoadingReducer.status.offlineMessage.visible && navigation.navigate('CreateTransaction', {});}}
                  >
                {/* <Text style={[isDarkMode ? {color: Colors.darker} : {color: Colors.darker}, {zIndex: 10}]}>+</Text> */}
                <IconButton icon="cube-send" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} />
                </TouchableOpacity>
                  // <Pressable
                  //       style={[styles.addButton, styles.button, styles.buttonOpen, {borderRadius: 64}]}
                  //       onPress={() => {!initialLoadingReducer.status.offlineMessage.visible && navigation.navigate('CreateTransaction', {});}}>
                  //         <Text>+</Text>
                  //   </Pressable>
                    :
                    <></>
                  }
      <ScrollView horizontal={false} showsVerticalScrollIndicator={true} style={{flex: 1, zIndex: 20}} 
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            title="Pull to refresh"
          />
          
        }
        >
          
        {/* <Text>
          Change code in the editor and watch it change on your phone!
          Save to get a shareable url.
        </Text> */}
        <View style={[{flexDirection: 'column', alignSelf: 'stretch'}]}>
        
          <View style={{flexDirection: 'row', alignSelf: 'stretch'}}>
            <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center'}]}>
              <SvgXml xml={dataUriExample} width={72} height={72} fill={"#61DDBC"}  />                
            </View>
            <View style={{justifyContent: 'center', flex: 1.5}}>
              <Text style={{textAlign: 'center', fontSize: 22}}>{accountName?.length < 11
                ? `${accountName}`
                : `${accountName?.substring(0, 10)}...`}</Text>             
            </View>
            <View style={[{ flex: 1}]}>
              {{avatar} ? <AvatarBox avatarRadnomNumber={avatar} width={96} smallRobot={false} onAvatarReady={onAvatarCreated}></AvatarBox> : <Text>{avatar}</Text>}
            </View>
          </View>
          <View style={{alignSelf: 'stretch'}}>
              {/* <SvgUri
                height={100}
                width={100}
                uri="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20fill%3D%22%2354b847%22%20d%3D%22M0%200h100v100H0z%22%2F%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M61.6%2069.1h-17V38.3h8.6v25.4h8.2c5.7%200%208.1-3.9%208.1-14.1S66.8%2036.4%2061%2036.4H42.2v32.7h-8.4V36.3H21.4v-5.4h42.3c10.2%200%2015%205.3%2015%2018.6-.1%2017.4-7.3%2019.6-17.1%2019.6%22%2F%3E%3C%2Fsvg%3E"

            /> */}
              {/* <SvgXml xml={getAvatar()} width={100} height={100} fill={"#61DDBC"}  />   */}
              {/* <SvgUri
                width="100%"
                height="100%"
                uri={avatar}
              /> */}
              {/* {getAvatarElement()} */}
              {/* <Image source={{uri: getAvatar(), scale: 1}} style={{height: 30, width: 30}}/> */}
              
              <View style={[isDarkMode ? {backgroundColor: '#323232'} : {backgroundColor: '#ddd' }, styles.container, {marginTop: 8, borderRadius: 16, flexDirection: 'column'}]}>
                <View style={{alignItems: 'center'}}>
                <Text style={[styles.sectionTitle, {fontSize: 32}]}></Text>
                
                <Text selectable style={[styles.sectionTitle, {fontSize: 24}]}>t₳ {balance.toLocaleString(undefined, {minimumFractionDigits: 6, maximumFractionDigits: 6})}</Text>
                <Text selectable style={[styles.sectionTitle, {fontSize: 16}]}>$ {(balance*fiatPrice.current).toLocaleString()}</Text>
                </View>
                <View style={[isDarkMode ? {backgroundColor: '#ccc'} : {backgroundColor: '#fff'}, {borderRadius: 16, margin: 8}]}>
                {address ? 
                  <TouchableOpacity  style={{flexDirection: 'row', marginHorizontal: 26}} onPress={copyAddress.bind(this, address)}>
                    <QrCode value={address}></QrCode>
                  </TouchableOpacity>
                  :
                  <TouchableOpacity  style={{flexDirection: 'row', marginHorizontal: 26}} onPress={copyAddress.bind(this, address)}>
                    <Text>{address}</Text>
                  </TouchableOpacity>
                 }
                </View>
                <View>
                <TouchableOpacity
                  style={styles.buttons}
                  onPress={showScanner}
                >                
                  <Text style={isDarkMode ? {color: Colors.lighter} : {color: Colors.darker}}>Scan QR</Text>
                </TouchableOpacity>
                 
                </View>
                {/* <TouchableOpacity  style={{flexDirection: 'row', marginHorizontal: 26}} onPress={copyAddress.bind(this, address)}>
                  <Text style={{alignSelf: 'stretch'}}>{address}</Text>
                  <IconButton size={12} icon="content-copy" style={[{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}]} />
                </TouchableOpacity> */}
                {
                  __DEV__ ?
                <TouchableOpacity
                  style={styles.buttons}
                  onPress={() => { Wallet.clearMemoryCache(); Wallet.clearStore(); setTransactions([]); reloadScreen(); }}
                >
                
                  <Text style={isDarkMode ? {color: '#ff4455'} : {color: Colors.red}}>delete</Text>
                </TouchableOpacity>
                :
                <></>
                }
                
              </View>
              </View>  
              <View style={{alignSelf: 'stretch'}}>
              <TransactionsList onClick={onRefresh} transactions={transactions} ></TransactionsList>
              </View>

              </View>
            </ScrollView>
              </SafeAreaView>
    )
  }, [isLoading, avatar, balance, address, accountName, isDarkMode, isScannerVisible] );

  const checkWallet = async(initialWallet = false) => {      
    var existingWallet = getCurrentAccount(); //JSON.parse(((await AsyncStorage.getItem(STORAGE.accounts)) as string)) as AccountSetting;
    setWalletIsAvailable(existingWallet !== undefined);
    if (!existingWallet) {
        dispatch({
            type: 'changeLoadingScreenVisibility',
            status: { loadingScreen: {visible: false, useBackgroundImage: true, opacity: 1} }
          });
        setTransactions([...transactions]);
        setIsLoading(false);
      return;
    }
  
    // var test = await AsyncStorage.getItem(STORAGE.network) as string;
    
    let network = await getNetwork();
    
    let price = fiatPrice.current;
    
    if (!initialLoadingReducer.status.offlineMessage.visible) {
      try {
        
        if (!fiatPrice.current) {          
          price = await provider.api.price("usd");          
          fiatPrice.current = price;
        }
      } catch (e) {} 
      
      await updateBalance(existingWallet as AccountInfo);      
      
    } else {
      fiatPrice.current = fiatPrice.current == 0 ? 0.4 : fiatPrice.current;
    }
    
    // if (isMounted)
    // {
    //   existingWallet = await updateAccount(false, netInfo.isConnected === null || !netInfo.isConnected);
    // }
    
    var lovelace = parseInt(((existingWallet[network.id]?.lovelace) as string));
    var ada = lovelace <= 100000 ? 0 : lovelace/1000000;
    var decimals = lovelace <= 100000 ? lovelace : lovelace % 1000000;
    var balance = parseFloat(ada.toString() + "." + decimals.toString());    
    
    await onRefresh(initialWallet);
    console.log("NEUUUU")
      console.log("HALLO WELT")
    
    setBalance(balance);    
    setAddr(existingWallet[network.id]?.paymentAddr as string);
    setBalance(balance);
    
    setAvatar(existingWallet.avatar);
    setAccountName((existingWallet).name);          
    
    setAddress(existingWallet[network.id]?.paymentAddr as string);
    
    dispatch({
        type: 'changeLoadingScreenVisibility',
        status: { loadingScreen: {visible: false, useBackgroundImage: true, opacity: 1} }
      });
    setIsLoading(false);
  };

  useEffect(() => {
    if (!route?.params?.hideLoadingScreen) {
      dispatch({
        type: 'changeLoadingScreenVisibility',
        status: { loadingScreen: {visible: true, useBackgroundImage: true, opacity: 1} }
      });
    }
    if (route.params?.skipWalletUpdate) {
      return;
    }
    
    checkWallet(route.params?.initialWallet).then(() => {
      dispatch({
        type: 'setInitializeState',
        status: { initialized: true }
      });
    });
    
    
  }, [route])

  useEffect(() => {    
    setIsLoading(false);
  }, [])

    return (
        
    <View style={[{paddingTop: 22, flexDirection: 'column', flex: 1}]}>  
        {/* <Stack fill center spacing={4}> */}
              {/* <Pressable
                style={[styles.button, styles.buttonOpen]}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.textStyle}>Show Modal</Text>
              </Pressable> 
        <IconButton
            icon="login"
            onPress={() => console.log('Pressed')}
          /> */}
          {walletIsAvailable ? showWalletScreen : <></>}
          
        {/* </Stack> */}
    </View>
    );    
};

const svgDecoded = Buffer.from("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODYuMTcgNDk5Ljg2Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzM0OWVhMzt9PC9zdHlsZT48L2RlZnM+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cGF0aCBpZD0icGF0aDE2IiBjbGFzcz0iY2xzLTEiIGQ9Ik03My44Nyw1Mi4xNSw2Mi4xMSw0MC4wN0EyMy45MywyMy45MywwLDAsMSw0MS45LDYxLjg3TDU0LDczLjA5LDQ4Ni4xNyw0NzZaTTEwMi40LDE2OC45M1Y0MDkuNDdhMjMuNzYsMjMuNzYsMCwwLDEsMzIuMTMtMi4xNFYyNDUuOTRMMzk1LDQ5OS44Nmg0NC44N1ptMzAzLjM2LTU1LjU4YTIzLjg0LDIzLjg0LDAsMCwxLTE2LjY0LTYuNjh2MTYyLjhMMTMzLjQ2LDE1LjU3SDg0TDQyMS4yOCwzNDUuNzlWMTA3LjZBMjMuNzIsMjMuNzIsMCwwLDEsNDA1Ljc2LDExMy4zNVoiLz48cGF0aCBpZD0icGF0aDE4IiBjbGFzcz0iY2xzLTEiIGQ9Ik0zOC4yNywwQTM4LjI1LDM4LjI1LDAsMSwwLDc2LjQ5LDM4LjI3djBBMzguMjgsMzguMjgsMCwwLDAsMzguMjcsMFpNNDEuOSw2MS44YTIyLDIyLDAsMCwxLTMuNjMuMjhBMjMuOTQsMjMuOTQsMCwxLDEsNjIuMTgsMzguMTNWNDBBMjMuOTQsMjMuOTQsMCwwLDEsNDEuOSw2MS44WiIvPjxwYXRoIGlkPSJwYXRoMjAiIGNsYXNzPSJjbHMtMSIgZD0iTTQwNS43Niw1MS4yYTM4LjI0LDM4LjI0LDAsMCwwLDAsNzYuNDYsMzcuNTcsMzcuNTcsMCwwLDAsMTUuNTItMy4zQTM4LjIyLDM4LjIyLDAsMCwwLDQwNS43Niw1MS4yWm0xNS41Miw1Ni40YTIzLjkxLDIzLjkxLDAsMSwxLDguMzktMTguMThBMjMuOTEsMjMuOTEsMCwwLDEsNDIxLjI4LDEwNy42WiIvPjxwYXRoIGlkPSJwYXRoMjIiIGNsYXNzPSJjbHMtMSIgZD0iTTEzNC41OCwzOTAuODFBMzguMjUsMzguMjUsMCwxLDAsMTU3LjkyLDQyNmEzOC4yNCwzOC4yNCwwLDAsMC0yMy4zNC0zNS4yMlptLTE1LDU5LjEzQTIzLjkxLDIzLjkxLDAsMSwxLDE0My41NCw0MjZhMjMuOSwyMy45LDAsMCwxLTIzLjk0LDIzLjkxWiIvPjwvZz48L2c+PC9zdmc+", 'base64').toString('ascii');
const dataUriExample = "data:image/svg+xml;base64" + svgDecoded;



const copyAddress = (address: string) => {
  Clipboard.setString(address);
  Toast.show({
    type: 'success',
    text1: 'address copied',
  });
}

async function getTxType(currentAddr: any, uTxOList: any) {
  if (!uTxOList) {
      return;
  }

  let inputsAddr = uTxOList.inputs.map((utxo: any) => utxo.address);
  let outputsAddr = uTxOList.outputs.map((utxo: any) => utxo.address);

  if (inputsAddr.every((addr: any) => addr === currentAddr)) {
      // sender
      return outputsAddr.every((addr: any) => addr === currentAddr)
        ? 'SELF'
        : 'OUT';
    } else if (inputsAddr.every((addr: any) => addr !== currentAddr)) {
      // receiver
      return 'IN';
    }
    // multisig
    return 'MULTISIG';
};
