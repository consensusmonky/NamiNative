import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, Image, Text, useColorScheme, View } from "react-native";
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


    const theme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: isDarkMode ? Colors.darker : Colors.lighter
        },
      };
      useEffect(() => {
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
        <NavigationContainer theme={theme}>
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
    </NavigationContainer>
    :
    <></>
    }
    </>
    );
}