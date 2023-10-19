import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Alert, AppState, AppStateStatus, BackHandler, EmitterSubscription, Image, Linking, Modal, Platform, Pressable, SafeAreaView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { useStateValue } from "../../hooks/StateProvider";
import { CreateAccountScreen } from "../CreateAccountScreen/CreateAccountScreen";
import { CreateTransactionScreen } from "../CreateTransactionScreen/CreateTransactionScreen";

import { SeedGeneratorScreen } from "../SeedGeneratorScreen/SeedGeneratorScreen";
import { SuccessWalletCreatedScreen } from "../SuccessWalletCreatedScreen/SuccessWalletCreatedScreen";
import { makeStyles } from "../../../style";
import { useNetInfo } from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import RNBootSplash from 'react-native-bootsplash';
import { WalletConnectProvider } from "../../components/WalletConnectProvider/WalletConnectProvider";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Checkbox, IconButton } from "react-native-paper";
import { SvgXml } from "react-native-svg";
//@ts-ignore
import { Backpack } from 'react-kawaii/lib/native/';

export const WelcomeScreen = ({navigation, route}: any) => {

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
  const [modalVisible, setModalVisible] = useState(false);
  const [checked, setChecked] = useState("unchecked" as "checked" | "unchecked" | "indeterminate");

  useEffect(() => {
    dispatch({
      type: 'changeLoadingScreenVisibility',
      status: { loadingScreen: {visible: false, useBackgroundImage: true, opacity: 1} }
    });
  }, [])


  // useEffect( () => {
  //   // Alert.alert(initialState)
  //     if (appOpened) {
  //       setInitialState(initialState);
  //     }
  // }, [appOpened, initialState])

  const Tab = createBottomTabNavigator();
  const svgDecoded = Buffer.from("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODYuMTcgNDk5Ljg2Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzM0OWVhMzt9PC9zdHlsZT48L2RlZnM+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cGF0aCBpZD0icGF0aDE2IiBjbGFzcz0iY2xzLTEiIGQ9Ik03My44Nyw1Mi4xNSw2Mi4xMSw0MC4wN0EyMy45MywyMy45MywwLDAsMSw0MS45LDYxLjg3TDU0LDczLjA5LDQ4Ni4xNyw0NzZaTTEwMi40LDE2OC45M1Y0MDkuNDdhMjMuNzYsMjMuNzYsMCwwLDEsMzIuMTMtMi4xNFYyNDUuOTRMMzk1LDQ5OS44Nmg0NC44N1ptMzAzLjM2LTU1LjU4YTIzLjg0LDIzLjg0LDAsMCwxLTE2LjY0LTYuNjh2MTYyLjhMMTMzLjQ2LDE1LjU3SDg0TDQyMS4yOCwzNDUuNzlWMTA3LjZBMjMuNzIsMjMuNzIsMCwwLDEsNDA1Ljc2LDExMy4zNVoiLz48cGF0aCBpZD0icGF0aDE4IiBjbGFzcz0iY2xzLTEiIGQ9Ik0zOC4yNywwQTM4LjI1LDM4LjI1LDAsMSwwLDc2LjQ5LDM4LjI3djBBMzguMjgsMzguMjgsMCwwLDAsMzguMjcsMFpNNDEuOSw2MS44YTIyLDIyLDAsMCwxLTMuNjMuMjhBMjMuOTQsMjMuOTQsMCwxLDEsNjIuMTgsMzguMTNWNDBBMjMuOTQsMjMuOTQsMCwwLDEsNDEuOSw2MS44WiIvPjxwYXRoIGlkPSJwYXRoMjAiIGNsYXNzPSJjbHMtMSIgZD0iTTQwNS43Niw1MS4yYTM4LjI0LDM4LjI0LDAsMCwwLDAsNzYuNDYsMzcuNTcsMzcuNTcsMCwwLDAsMTUuNTItMy4zQTM4LjIyLDM4LjIyLDAsMCwwLDQwNS43Niw1MS4yWm0xNS41Miw1Ni40YTIzLjkxLDIzLjkxLDAsMSwxLDguMzktMTguMThBMjMuOTEsMjMuOTEsMCwwLDEsNDIxLjI4LDEwNy42WiIvPjxwYXRoIGlkPSJwYXRoMjIiIGNsYXNzPSJjbHMtMSIgZD0iTTEzNC41OCwzOTAuODFBMzguMjUsMzguMjUsMCwxLDAsMTU3LjkyLDQyNmEzOC4yNCwzOC4yNCwwLDAsMC0yMy4zNC0zNS4yMlptLTE1LDU5LjEzQTIzLjkxLDIzLjkxLDAsMSwxLDE0My41NCw0MjZhMjMuOSwyMy45LDAsMCwxLTIzLjk0LDIzLjkxWiIvPjwvZz48L2c+PC9zdmc+", 'base64').toString('ascii');
  const dataUriExample = "data:image/svg+xml;base64" + svgDecoded;
  
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: isDarkMode ? Colors.darker : Colors.lighter
    },
  };

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
              <View style={{paddingTop: 50, alignItems: 'center'}}>
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

    );
}
