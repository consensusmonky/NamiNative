/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import type {PropsWithChildren} from 'react';
import React, { useEffect, useState } from 'react';
import { Platform,  useColorScheme } from 'react-native';
import { makeStyles } from './style';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { DefaultTheme } from '@react-navigation/native';
import { StateProvider} from './src/hooks/StateProvider';
import { LayoutContainer } from './src/screens/LayoutContainer';
import { InitialStateReducer } from './src/hooks/reducers/InitialStateReducer';
import { AccountInfoReducer } from './src/hooks/reducers/AccountInfoReducer';
import PushNotification, { Importance } from 'react-native-push-notification';
import { getCurrentAccount, getNetwork, getUtxos } from './src/services/ApiConnectorService';

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
  const [visible, setVisible] = useState(false);



  // initial State property
  // const initialState = {
  //   theme: { primary: 'green' }
  // };

  const initialState = {
    initialLoadingReducer: {
      type: 'initialState',
      status: { loadingScreen: { visible: true, useBackgroundImage: true, opacity: 1 }, offlineMessage: {visible: false}, exitAppTimeoutId: undefined, initialized: false }
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

  useEffect(() => {
    if (!initialState.initialLoadingReducer.status.exitAppTimeoutId) {
        return;
    }
    
    clearTimeout(initialState.initialLoadingReducer.status.exitAppTimeoutId)

  //   setInterval(() => {
  //     setVisible(!visible);
  //   }, 2000);
  }, []);
  
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
      <LayoutContainer />
    </StateProvider>
    </>
  );
}


export default App;
