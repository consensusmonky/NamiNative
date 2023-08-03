
import { Stack } from '@react-native-material/core';
import { Buffer } from "buffer";
import { useEffect, useState } from 'react';
// @ts-expect-error
import { Backpack } from 'react-kawaii/lib/native/';
import {
  Alert,
  Button,
    Image,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
  } from 'react-native';
import { Checkbox, IconButton } from 'react-native-paper';
import Svg, { SvgUri, SvgXml } from 'react-native-svg';
import { credentialsAvailable, storeCredentials } from '../utils/CredentialStore';
import * as Keychain from 'react-native-keychain';
import React from 'react';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { makeStyles } from '../../style';
import { useStateValue } from '../hooks/StateProvider';


export const SuccessWalletCreatedScreen = ({navigation}: any) => {

  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);

  // const isDarkMode = useColorScheme() === 'dark';
  
  // const styles = StyleSheet.create({
  //   container: {
  //     alignItems: 'center',
  //     flex: 1
  //   },
  //   buttons: {
  //     backgroundColor: '#2a2a2a',
  //     padding: 10,
  //     margin: 5,
  //     borderRadius: 6,   
  //     alignItems: 'center'
  //   },

  //   centeredView: {
  //     flex: 1,
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //     marginTop: 22,
  //   },
  //   modalView: {
  //     margin: 20,
  //     backgroundColor: 'white',
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
  //   input: {
  //     height: 32,
  //     fontSize: 12,
  //     margin: 6,
  //     width: 146,
  //     borderWidth: 1,
  //     padding: 0,
  //     paddingLeft: 10,
  //   },

  //   sectionTitle:
  //   {
  //     color: isDarkMode ? Colors.light : Colors.dark
  //   },

  //   backgroundTheme:
  //   {
  //     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter
  //   }
  // });
  const [modalVisible, setModalVisible] = useState(false);
  const [checked, setChecked] = useState("unchecked" as "checked" | "unchecked" | "indeterminate");


  useEffect(() => {
    // storeCredentials("phill", "abc").then((result) => {
    //   Alert.alert(result == false ? "FALSE" : "TRUE1");
    // });
    // Keychain.resetGenericPassword();
    
    navigation.addListener('beforeRemove', (e: any) => {
      // if (!hasUnsavedChanges) {
        e.data.action.type != "GO_BACK" ? navigation.dispatch(e.data.action) : e.preventDefault();
      // }
    });
  }, [navigation]);

  const [text, onChangeText] = React.useState('Useless Text');
  const [number, onChangeNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('Account #0');
  const [{ initialLoadingReducer }, dispatch] = useStateValue();

  function goBackHome() {
    dispatch({
      type: 'changeLoadingScreenVisibility',
      status: { loadingScreen: {visible: true, useBackgroundImage: true, opacity: 1} }
    });

    setModalVisible(!modalVisible);
    setChecked("unchecked");
    setTimeout(() => {
      navigation.navigate('Home', {initialWallet: true});
    }, 500)
  }

    return (
        
    <View style={{paddingTop: 50}}>
      <ScrollView>        
        <Stack fill center spacing={4} >
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
            <SvgXml xml={dataUriExample} width={50} height={50} fill={"#61DDBC"}  />  
            </View>
            {/* <Image source={{uri:"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMyAyIj4NCjxwYXRoIGZpbGw9IiMwMDk1NDMiIGQ9Im0wLDBoM3YyaC0zeiIvPg0KPHBhdGggZmlsbD0iI2ZiZGU0YSIgZD0ibTAsMmwyLTJoMXYyeiIvPg0KPHBhdGggZmlsbD0iI2RjMjQxZiIgZD0ibTMsMHYyaC0yeiIvPg0KPC9zdmc+DQo="}} style={{width:100,height:100}}/> */}
            <View style={[styles.container, {paddingTop: 50}]}>
              <Text style={[styles.sectionTitle, {fontSize: 32}]}>Wallet created</Text>
            </View>
            <View style={{paddingTop: 50}}>
            <SafeAreaView>
              <View style={{paddingTop: 50}}>
                <Backpack size={120} mood="blissful" color="#61DDBC" />
              </View>
            </SafeAreaView>
            </View>
            <View style={{marginTop: 20}}>
            
            <TouchableOpacity
                style={[styles.buttons, styles.buttonOpen]}
                onPress={goBackHome}
            >
                <Text style={[isDarkMode ? Colors.darker : Colors.darker]}>Home</Text>
            </TouchableOpacity>
            </View>
            
              {/* <Pressable
                style={[styles.button, styles.buttonOpen]}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.textStyle}>Show Modal</Text>
              </Pressable> */}
        {/* <IconButton
            icon="login"
            
            
            onPress={() => console.log('Pressed')}
          /> */}
        </Stack>
      </ScrollView>
    </View>
    
    //   <Button
    //     title="WelcomeGo to Jane's profile"
    //     onPress={() =>
    //       navigation.navigate('Profile', {name: 'Jane'})
    //     }
    //   />
    );

    
};

const svgDecoded = Buffer.from("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODYuMTcgNDk5Ljg2Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzM0OWVhMzt9PC9zdHlsZT48L2RlZnM+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cGF0aCBpZD0icGF0aDE2IiBjbGFzcz0iY2xzLTEiIGQ9Ik03My44Nyw1Mi4xNSw2Mi4xMSw0MC4wN0EyMy45MywyMy45MywwLDAsMSw0MS45LDYxLjg3TDU0LDczLjA5LDQ4Ni4xNyw0NzZaTTEwMi40LDE2OC45M1Y0MDkuNDdhMjMuNzYsMjMuNzYsMCwwLDEsMzIuMTMtMi4xNFYyNDUuOTRMMzk1LDQ5OS44Nmg0NC44N1ptMzAzLjM2LTU1LjU4YTIzLjg0LDIzLjg0LDAsMCwxLTE2LjY0LTYuNjh2MTYyLjhMMTMzLjQ2LDE1LjU3SDg0TDQyMS4yOCwzNDUuNzlWMTA3LjZBMjMuNzIsMjMuNzIsMCwwLDEsNDA1Ljc2LDExMy4zNVoiLz48cGF0aCBpZD0icGF0aDE4IiBjbGFzcz0iY2xzLTEiIGQ9Ik0zOC4yNywwQTM4LjI1LDM4LjI1LDAsMSwwLDc2LjQ5LDM4LjI3djBBMzguMjgsMzguMjgsMCwwLDAsMzguMjcsMFpNNDEuOSw2MS44YTIyLDIyLDAsMCwxLTMuNjMuMjhBMjMuOTQsMjMuOTQsMCwxLDEsNjIuMTgsMzguMTNWNDBBMjMuOTQsMjMuOTQsMCwwLDEsNDEuOSw2MS44WiIvPjxwYXRoIGlkPSJwYXRoMjAiIGNsYXNzPSJjbHMtMSIgZD0iTTQwNS43Niw1MS4yYTM4LjI0LDM4LjI0LDAsMCwwLDAsNzYuNDYsMzcuNTcsMzcuNTcsMCwwLDAsMTUuNTItMy4zQTM4LjIyLDM4LjIyLDAsMCwwLDQwNS43Niw1MS4yWm0xNS41Miw1Ni40YTIzLjkxLDIzLjkxLDAsMSwxLDguMzktMTguMThBMjMuOTEsMjMuOTEsMCwwLDEsNDIxLjI4LDEwNy42WiIvPjxwYXRoIGlkPSJwYXRoMjIiIGNsYXNzPSJjbHMtMSIgZD0iTTEzNC41OCwzOTAuODFBMzguMjUsMzguMjUsMCwxLDAsMTU3LjkyLDQyNmEzOC4yNCwzOC4yNCwwLDAsMC0yMy4zNC0zNS4yMlptLTE1LDU5LjEzQTIzLjkxLDIzLjkxLDAsMSwxLDE0My41NCw0MjZhMjMuOSwyMy45LDAsMCwxLTIzLjk0LDIzLjkxWiIvPjwvZz48L2c+PC9zdmc+", 'base64').toString('ascii');
const dataUriExample = "data:image/svg+xml;base64" + svgDecoded;