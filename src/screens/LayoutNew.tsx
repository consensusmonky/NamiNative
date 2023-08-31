import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, AppState, AppStateStatus, BackHandler, EmitterSubscription, Image, Linking, Modal, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { useStateValue } from "../hooks/StateProvider";
import { CreateAccountScreen } from "./CreateAccountScreen";
import { CreateTransactionScreen } from "./CreateTransactionScreen";
import { HomeScreen } from "./HomeScreen";
import { SeedGeneratorScreen } from "./SeedGeneratorScreen";
import { SuccessWalletCreatedScreen } from "./SuccessWalletCreatedScreen";
import { makeStyles } from "../../style";
import { useNetInfo } from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import RNBootSplash from 'react-native-bootsplash';
import { WalletConnectProvider } from "../components/WalletConnectProvider";

export const LayoutNew = () => {

  const Stack = createNativeStackNavigator();

  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);

  const netInfo = useNetInfo();

  const [{ initialLoadingReducer }, dispatch] = useStateValue();

  const linking = {
    prefixes: ['wc:'],
    config: {
      screens: {
        WalletConnectProvider: {
          // path: ':pairingTopic@2?symKey=:symKey&relay-protocol=:relayProtocol'
        },
      },
    },
  };

  const [initialState, setInitialState] = useState("");
  const [appOpened, setAppOpened] = useState(false);

  useEffect(() => {
    if (!appOpened) {
      return;
    }
    
    const restoreState = async () => {
      try {
        
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl != null) {
          setInitialState(initialUrl);
        }
        if (Platform.OS !== 'web' && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
        }
      } finally {
        //setIsReady(true);
      }
    };

    // if (!isReady) {
       restoreState();
    // }
  }, [appOpened]);

  // useEffect( () => {
  //   // Alert.alert(initialState)
  //     if (appOpened) {
  //       setInitialState(initialState);
  //     }
  // }, [appOpened, initialState])

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: isDarkMode ? Colors.darker : Colors.lighter
    },
  };

    return (
      <>      
        <View style={{zIndex: 100}}>
          <Toast />
        </View>  
        <View style={[initialLoadingReducer.status.offlineMessage.visible ? {display: 'flex'} : {display: 'none'}, {left:0, right:0 , height: 64, backgroundColor: Colors.darkred, position: "absolute", zIndex: 15, alignItems: 'center', justifyContent: 'center'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ActivityIndicator size="small" color={Colors.lighter} />
              <Text style={{color: Colors.lighter, paddingLeft: 12}}>You are offline</Text>
            </View>
            <Text style={{color: Colors.lighter, fontSize: 12}}>waiting to come back online</Text>
          </View>
          <View style={[initialLoadingReducer.status.loadingScreen.visible ? {display: 'flex'} : {display: 'none'}, {position: 'absolute', zIndex: 10, bottom: 0, right:0, top: 0, left:0, alignSelf:"stretch", borderStyle: "solid", alignItems:'center', justifyContent: 'center', opacity: initialLoadingReducer.status.loadingScreen.opacity}, isDarkMode ? { borderColor: '#111', backgroundColor: '#111' } : { borderColor: '#111', backgroundColor: '#111'}]}>
          {/* { initialLoadingReducer.status.loadingScreen.useBackgroundImage ?
            <Image source={require('../assets/spacebudz_bg.png')} style={{position: 'absolute', resizeMode: "contain", opacity: 0.6, flex: 1}}/>
            :
            <></>
          }           */}
            <ActivityIndicator size="large" color={Colors.lighter} />
            <Text style={{fontSize: 16, color: Colors.lighter}}>NamiNative</Text>          
          </View>
          {
            netInfo.isConnected !== null ?
              <NavigationContainer theme={theme} onReady={() => { setAppOpened(true); RNBootSplash.hide({ fade: true, duration: 500 }); }}
              // initialState={initialState}
              linking={linking}
              onStateChange={(state) => console.log('New state is', state)}
              fallback={<Text>Loading...</Text>}
              /*linking={{
                prefixes: ['wc://'],
                config: {
                  screens: {
                    HomeScreen: 'Home',
                  },
                },
                subscribe(listener) { const initializeDeepLink = async () => {           
                    if (url.current || !web3wallet || (url.current.indexOf("wc:") < 0 && url.current)) {
                      console.log(url.current)
                      return;
                    }

                    const subscription = Linking.addEventListener("url", async (event) => {
                      openDeepLink(event.url);
                      url.current = event.url;
                      // Linking.canOpenURL(event.url).then(async (supported) => {
                      //     if (supported) {
                      //       console.log(supported);
                      //       console.log(event.url);
                      //       // event.url = ""
                      //       console.log("######################");
                      //       // Object.values(web3wallet.getActiveSessions()).map(async (session: any) => console.log(await session.topic))
                      //       var activeSessions = await web3wallet?.getActiveSessions();
                            
                      //       // console.log(activeSessions);
                      //       console.log("######################");
                      //       if (activeSessions) {
                      //         Object.keys(activeSessions).map(async (topic: string) => {
                      //           // console.log("JAA");
                      //           console.log(topic);
                                
                      //           // await web3wallet.disconnectSession({
                      //           //   topic: topic,
                      //           //   reason: {code: 0,  message: "USER DISCONNECTED"},
                      //           // });
                      //         })
                      //       }
                            
                      //       var splitUrl = event.url.split("@");
                      //       var topic = "";
                      //       if (splitUrl.length > 1)
                      //       {
                      //         topic = splitUrl[0].slice(3);
                      //       }
              
                      //       var pairings = web3wallet.core.pairing.getPairings();
                      //       pairings.map((pair) => {
                      //         //web3wallet.core.pairing.disconnect({topic: pair.topic});
                      //       })
                      //       var existingPairing = pairings.find((pair) => {
                      //         return pair.topic == topic;
                      //       });
              
                      //       if (existingPairing == undefined) {
                      //         // if (pairings.length == 0) {
                      //           console.log("NEW PAIRING")
                      //           console.log(topic)
                      //           var pairing = await web3wallet.core.pairing.pair({ uri: event.url });
                      //         // }              
                      //       }
                      //       else {
                      //         console.log("ALREADY PAIRED")
                      //         console.log(topic)
                      //       }
                      //     }
                      // });
                    });

                    const getInitialURL = async () => {
                      // Check if app was opened from a deep link
                      
                      const deepLink = await Linking.getInitialURL();            
                      if (deepLink) {
                        url.current = deepLink; 
                        // dispatch({
                        //   type: 'changeLoadingScreenVisibility',
                        //   status: { loadingScreen: {visible: true, useBackgroundImage: true, opacity: 0.95} }
                        // });
                        openDeepLink(deepLink, true);                  
                      } 
                      // return () => {
                      //   // Clean up the event listeners
                      //   subscription.remove();
                      // };     
                    }
                    await getInitialURL();

                  return () => {
                    // Clean up the event listeners
                    Linking.removeAllListeners("url");
                    subscription.remove();
                  };
                }
                initializeDeepLink();
              }
            }}*/
              >
            <Stack.Navigator>                
              <Stack.Screen name="Home" options={{title: "", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={HomeScreen} />
              <Stack.Screen name="SeedGenerator"  options={{title: "", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={SeedGeneratorScreen} />
              <Stack.Screen name="CreateAccount" options={{title: "", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={CreateAccountScreen} />
              <Stack.Screen name="SuccessWalletCreated" options={{title: "", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={SuccessWalletCreatedScreen} />
              <Stack.Screen name="CreateTransaction" options={{title: "New Transaction", headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={CreateTransactionScreen} />        
            </Stack.Navigator>      
          </NavigationContainer>
      :
      <></>
    }
    {
      appOpened ? <WalletConnectProvider deepLink={initialState ?? ""}></WalletConnectProvider> : <></>
    }
    </>

    );
}