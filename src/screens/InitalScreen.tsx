import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, AppState, AppStateStatus, BackHandler, EmitterSubscription, Image, Linking, Modal, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { useStateValue } from "../hooks/StateProvider";
import { CreateAccountScreen } from "./CreateAccountScreen";
import { CreateTransactionScreen } from "./CreateTransactionScreen";

import { SeedGeneratorScreen } from "./SeedGeneratorScreen";
import { SuccessWalletCreatedScreen } from "./SuccessWalletCreatedScreen";
import { makeStyles } from "../../style";
import { useNetInfo } from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import RNBootSplash from 'react-native-bootsplash';
import { WalletConnectProvider } from "../components/WalletConnectProvider";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from "./HomeScreen";
import { IconButton } from 'react-native-paper';
import { ProfileScreen } from "./ProfileScreen";
import { StakingScreen } from "./StakingScreen";

export const InitialScreen = () => {

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

  const Tab = createBottomTabNavigator();

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: isDarkMode ? Colors.darker : Colors.lighter
    },
  };

    return (
        <Tab.Navigator
                screenOptions={({ route }) => ({
                headerShown: false,
                headerMode: 'none',
                navigationOptions: {
                    headerVisible: false,
                },
                tabBarStyle: {
                    height: 80,
                    paddingHorizontal: 8,
                    paddingTop: 0,
                    paddingBottom: 8,
                    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
                    borderTopWidth: 8,
                    justifyContent: 'flex-start'
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
        
                    if (route.name === 'Home') {
                      iconName = focused
                        ? 'home'
                        : 'home';
                    } else if (route.name === 'Assets') {
                      iconName = focused ? 'gold' : 'gold';
                    } else if (route.name === 'Staking') {
                        iconName = focused ? 'package-variant-closed' : 'package-variant-closed';
                    }
                    
        
                    // You can return any component that you like here!
                    return <IconButton icon={iconName ?? 'home'} style={{ backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter }} />;
                  },
                  tabBarActiveTintColor: isDarkMode ? Colors.light : Colors.dark,
                  tabBarInactiveTintColor: isDarkMode ? 'darkgray' : 'darkgray'
            })}
                >
                    <Tab.Screen name="Home" options={{title: "Home", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={HomeScreen} />
                    <Tab.Screen name="Staking" options={{title: "Staking", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={StakingScreen} />
                    <Tab.Screen name="Assets" options={{title: "Assets", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={StakingScreen} />
                </Tab.Navigator>

    );
}