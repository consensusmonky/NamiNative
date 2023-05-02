
import { Stack } from '@react-native-material/core';
import { Buffer } from "buffer";
import { useCallback, useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
  } from 'react-native';

import { SvgXml } from 'react-native-svg';
import React from 'react';
import { WalletService } from '../utils/WalletServiceProvider';
import { makeStyles } from '../../style';
import { debounce, throttle } from 'lodash';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export const CreateAccountScreen = ({navigation, route}: any) => {

  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);

  const [modalVisible, setModalVisible] = useState(false);
  const [checked, setChecked] = useState("unchecked" as "checked" | "unchecked" | "indeterminate");
  const [enabled, setEnabled] = useState(false);
  const [mnemonic, setMnemonic] = React.useState(new Array<string>());

  const [text, onChangeText] = React.useState('Useless Text');
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");


  async function createAccountCallback() {
    let rootKey = await WalletService.createWallet(route.params.entropy, password)
    await WalletService.createAccount(accountName, password, 0);
    WalletService.getWalletAddress(password, 0).then((e) => {
      // Alert.alert("CORRECT PASSWORD")
    }).catch(() => {
      // Alert.alert("WRONG PASSWORD")
    });

    navigation.navigate('SuccessWalletCreated', {})
  }

  async function checkOnFinished() {
    if (errorMessage != "") {
      return;
    }
    const debouncedCreate = debounce(() => createAccountCallback(), 1000, {
      leading: true,
      trailing: false,
});
		debouncedCreate();    
  }

  useEffect(() => {
    if (__DEV__) {
      setPassword("12345678");
      setPassword2("12345678");
      setAccountName("m0nkY");
    }

  }, []);

  useEffect(() => {
    setEnabled(false);
    setErrorMessage("");
    
    if (accountName === "") {
      
      setErrorMessage("Your accountname is missing");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Your password needs at least 8 characters");
      return;
    }
    if (password == "") {
      setErrorMessage("Your password is empty");
      return;
    }
    if (password !== password2) {
      setErrorMessage("Your passwords do not match");
      return;
    }
    setEnabled(true);
  }, [accountName, password, password2])

    return (
        
            
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
              <Text style={[styles.sectionTitle, {fontSize: 32}]}>Create Account</Text>
            </View>
            <View style={{paddingTop: 50}}>
            <SafeAreaView>
            <TextInput
                style={styles.input}
                value={accountName}
                onChangeText={(newAccountName: string) => {setAccountName(newAccountName);}}
                placeholder="Enter account name"
              />
              <TextInput
                style={styles.input}
                onChangeText={(newPassword: string) => {setPassword(newPassword);}}
                value={password}
                placeholder="Enter password"
                secureTextEntry={true}
              />
              <TextInput
                style={styles.input}
                onChangeText={(newPassword: string) => {setPassword2(newPassword);}}
                value={password2}
                placeholder="Enter password again"
                secureTextEntry={true}
              />
            </SafeAreaView>
            </View>
            <View style={{marginTop: 20}} >
            
            <TouchableOpacity
              
                style={[styles.buttons, styles.buttonOpen, !enabled ? {backgroundColor: "#666", opacity: 0.3} : {}]}
                onPress={() => enabled ? checkOnFinished() : ""}
            >
                <Text style={[isDarkMode ? Colors.darker : Colors.darker]}>Create</Text>
            </TouchableOpacity>
            </View>
            <View style={[styles.container, {paddingTop: 0}]}>
              <Text style={[{color: "red"}]}>{errorMessage}</Text>
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