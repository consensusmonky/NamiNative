import { DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Linking,  Modal,  Platform, Pressable, Text, View, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { useStateValue } from "../../hooks/StateProvider";
import { makeStyles } from "../../../style";
import { useNetInfo } from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from "../HomeScreen/HomeScreen";
import { Checkbox, IconButton } from 'react-native-paper';
import { StakingScreen } from "../StakingScreen/StakingScreen";
import { LootScreen } from "../LootScreen/LootScreen";
import { SettingsScreen } from "../SettingScreen/SettingsScreen";
import PayScreenModal from "../../components/PayScreenModal/PayScreenModal";

const PayScreenComponent = () => {
  return null
}

export const InitialScreen = () => {

  const isDarkMode = useColorScheme() === 'dark';
  const Stack = createNativeStackNavigator();
  const styles = makeStyles(isDarkMode);
  const netInfo = useNetInfo();

  const [{ initialLoadingReducer }, dispatch] = useStateValue();
  const [initialState, setInitialState] = useState("");
  const [appOpened, setAppOpened] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const Tab = createBottomTabNavigator();

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: isDarkMode ? Colors.darker : Colors.lighter
    },
  };

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

    restoreState();
    
  }, [appOpened]);  

    return (
      <>
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
                    </View>
                  </View>
                </Modal>
     
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
        
                    if (route.name === 'Wallet') {
                      iconName = focused
                        ? 'wallet-outline'
                        : 'wallet-outline';
                    } else if (route.name === 'Settings') {
                      iconName = focused ? 'cog-outline' : 'cog-outline';
                    } else if (route.name === 'Delegate') {
                        iconName = focused ? 'package-variant-closed' : 'package-variant-closed';
                    } else if (route.name === 'Loot') {
                    iconName = focused ? 'treasure-chest' : 'treasure-chest';
                }
                    
                    
        
                    // You can return any component that you like here!
                    return <IconButton icon={iconName ?? 'home'} style={{ backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter }} />;
                  },
                  tabBarActiveTintColor: isDarkMode ? Colors.light : Colors.dark,
                  tabBarInactiveTintColor: isDarkMode ? 'darkgray' : 'darkgray'
            })}
                >
                    <Tab.Screen name="Wallet" options={{title: "Wallet", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={HomeScreen} />
                    <Tab.Screen name="Loot" options={{title: "Loot", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={LootScreen} />
                    <Tab.Screen name="Pay"  component={PayScreenComponent} options={{
                      title: "Holdings", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter,
                      tabBarButton: () => (<PayScreenModal />),
                    }} />
                    <Tab.Screen name="Delegate" options={{title: "Delegate", headerShown: false, headerStyle: {backgroundColor: Colors.darker, height: 48}, headerTintColor: Colors.lighter}} component={StakingScreen} />
                    <Tab.Screen name="Settings" options={{title: "Settings", headerShown: false, headerStyle: {backgroundColor: Colors.darker}, headerTintColor: Colors.lighter}} component={SettingsScreen} />
                </Tab.Navigator>
                </>
    );
}