/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as encoding from 'text-encoding'
import React, { useCallback, useContext, useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import { ThemeContext } from "@react-native-material/core";
import { ErrorResponse, JsonRpcResponse } from "@walletconnect/jsonrpc-utils";
import { IconButton } from 'react-native-paper';
import { Buffer } from "buffer";

import {
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { SignClient } from '@walletconnect/sign-client';
import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CreateAccountScreen } from './src/screens/CreateAccountScreen';
import { Alert } from 'react-native/Libraries/Alert/Alert';
import { SeedGeneratorScreen } from './src/screens/SeedGeneratorScreen';
import { SuccessWalletCreatedScreen } from './src/screens/SuccessWalletCreatedScreen';
import SimpleLottie from './src/components/Animation';
import AvatarBox from './src/components/AvatarBox';
import { StateContext, StateProvider, useStateValue } from './src/hooks/StateProvider';
import { LayoutNew } from './src/screens/LayoutNew';
import { InitialStateReducer } from './src/hooks/reducers/InitialStateReducer';
import { AccountInfoReducer } from './src/hooks/reducers/AccountInfoReducer';
import BackgroundFetch from 'react-native-background-fetch';
import PushNotification, { Importance } from 'react-native-push-notification';
import { makeStyles } from './style';
import useInitialization, { web3wallet } from './src/utils/Web3WalletClient';
import { SignClientTypes, SessionTypes } from "@walletconnect/types";
import PairingModal from './src/screens/PairingModal/PairingModal';
import { getCurrentAccount, getNetwork, getUtxos } from './src/services/NetworkDataProviderService';
import { Address, hash_transaction, Transaction, TransactionBody, TransactionUnspentOutput, TransactionWitnessSet } from '@emurgo/react-native-haskell-shelley';
import { APIError, ERROR, NETWORK_ID, TxSendError } from './src/config/config';
import { blockfrostRequest } from './src/utils/ApiExtensions';
import { signTx } from './src/utils/Ledger';
import SigningModal from './src/screens/SigningModal/SigningModal';
// import { AuthClient } from "@walletconnect/auth-client";

type SectionProps = PropsWithChildren<{
  title: string;
}>;

// const core = new Core({
//   projectId: "472ead5d9fdcac0cafb1949a2841111e",
// });

// const metadata = {
//   name: "Example Dapp",
//   description: "Example Dapp",
//   url: "#",
//   icons: ["https://walletconnect.com/walletconnect-logo.png"],
// };

// function Section({children, title}: SectionProps): JSX.Element {
  
  
 


  

//   return (
//     <View style={styles.sectionContainer}>
//       <Text
//         style={[
//           styles.sectionTitle,
//           {
//             color: isDarkMode ? Colors.white : Colors.black,
//           },
//         ]}>
//         {title}
//       </Text>
//       <Text
//         style={[
//           styles.sectionDescription,
//           {
//             color: isDarkMode ? Colors.light : Colors.dark,
//           },
//         ]}>
//         {children}
//       </Text>
//     </View>
//   );
// }
// Push notifications setup (recommend extracting into separate file)


PushNotification.configure({
  // onNotification is called when a notification is to be emitted
  onNotification: notification => console.log(notification),

  // Permissions to register for iOS
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },
  popInitialNotification: true,
});

PushNotification.createChannel( {
    channelId: "1",
    channelName: "TransactionChannel",
    channelDescription: "Notifies the user about new transactions.",
    playSound: true,
    soundName: Platform.OS === 'android'
                ? 'default' //android.resource://com.rnfirebasenotification/raw/mint
                : 'default', // *.wav
    importance: Importance.HIGH,
    vibrate: true,
  },
  (created) => console.log(`createChannel returned '${created}'`) 
  );    

function App(): JSX.Element {

  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);
  const existingWallet = getCurrentAccount();
  let network = getNetwork();
  const initialized = useInitialization();


  useEffect(() => {
    console.log('App Initalized: ', initialized);
  }, [initialized]);
  
  
  const [visible, setVisible] = useState(false);

  // useEffect(() => {
  //   setInterval(() => {
  //     setVisible(!visible);
  //   }, 2000);
  // }, []);

  // initial State property
  // const initialState = {
  //   theme: { primary: 'green' }
  // };

  const initialState = {
    initialLoadingReducer: {
      type: 'initialState',
      status: { loadingScreen: {visible: true}, offlineMessage: {visible: false} }
    },
    accountInfoReducer: {
      address: {},
      value: {},
      message: {},
      txInfo: {},
      fee: {},
      tx: {}
    }
  };
  
  // const reducer = (state: any, action: {type: string, loadingScreen: {visible: boolean}}) => {
  //   switch (action.type) {
  //     case 'changeLoadingScreenVisibility':
        
  //       return {
  //         ...state,
  //         loadingScreen: action.loadingScreen
  //       };

  //     default:
  //       return state;
  //   }
  // };



const mainReducer = ({ initialLoadingReducer, accountInfoReducer  }: any, action: any) => {
  return  {
    initialLoadingReducer: InitialStateReducer(initialLoadingReducer, action),
    accountInfoReducer: AccountInfoReducer(accountInfoReducer, action)
  }
}

  // const isDarkMode = useColorScheme() === 'dark';
  //  const theme = useContext(ThemeContext);
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: isDarkMode ? Colors.darker : Colors.lighter
    },
  };
  // const backgroundStyle = {
  //   backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  // };

  
// const styles = StyleSheet.create({
//   sectionContainer: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//     backgroundColor: isDarkMode ? Colors.dark : Colors.light
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: isDarkMode ? Colors.dark : Colors.light
//   },
//   sectionDescription: {
//     marginTop: 8,
//     fontSize: 18,
//     fontWeight: '400',
//   },
//   highlight: {
//     fontWeight: '700',
//   },
  
// });

  return (
    /*</>
    // <NavigationContainer>
    // <View>
    //   <ScrollView>        
    //     <Stack fill center spacing={4}>
    //     <IconButton
    //         icon="login"
    //         size={20}
    //         iconColor={Colors.red500}
    //         onPress={() => console.log('Pressed')}
    //       />
    //     </Stack>
    //   </ScrollView>
    // </View>
    // </NavigationContainer>
    */
    <>    
    <StateProvider initialState={initialState} reducer={mainReducer} >
      <LayoutNew />
    </StateProvider>
    </>
  );
}


export default App;
