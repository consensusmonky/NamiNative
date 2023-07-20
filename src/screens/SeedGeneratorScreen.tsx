
import { Stack } from '@react-native-material/core';
import { Buffer } from "buffer";
import { useCallback, useEffect, useRef, useState } from 'react';
import "@mfellner/react-native-fast-create-hash"
// @ts-expect-error
import { Backpack } from 'react-kawaii/lib/native/';
import {
  Alert,
  Button,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
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
    TouchableWithoutFeedback,
    useColorScheme,
    View,
  } from 'react-native';
import { Checkbox, IconButton } from 'react-native-paper';
import Svg, { SvgUri, SvgXml } from 'react-native-svg';
import { credentialsAvailable, storeCredentials } from '../utils/CredentialStore';
import * as Keychain from 'react-native-keychain';
import React from 'react';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { generateMnemonic, mnemonicToEntropy } from '@mfellner/react-native-bip39';
import { Bip32PrivateKey, encrypt_with_password, decrypt_with_password, NetworkInfo, StakeCredential, BaseAddress, RewardAddress, PrivateKey } from '@emurgo/react-native-haskell-shelley';
import { generateSecureRandom } from 'react-native-securerandom';
import { WalletService } from '../utils/WalletServiceProvider';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { makeStyles } from '../../style';
import { Wordlist } from '../data/Wordlist';




// export const mnemonicToObject = (mnemonic: string, emptyMap: boolean = false): {word: string, index: number}[] => {
//   const mnemonicMap = new Array<{word: string, index: number}>;
//   var counter = 0;
//   // Do not use this mnemonic object for other purposes than the flatList element.
//   // We need to add the words alternately to show it "correctly".
//   var mnemonicArray = !emptyMap ? mnemonic.split(' ') : new Array<string>();
//   mnemonicArray.forEach((word, index) => {

//       if (counter == 12) {
//         counter = 0;
//       }
//       if (index < 12) {
//         //odd index for correct flatList view.
//         var transposedIndex = index == 0 ? index : index + counter;
//         mnemonicMap[transposedIndex] = {word: word, index: index}    
//       } else {
//         // even index for correct flatList view.
//         var resetIndex = index - ((mnemonicArray.length/2)-1);
//         var transposedIndex = resetIndex == 1 ? resetIndex : resetIndex + counter
//         mnemonicMap[transposedIndex] = {word: word, index: index}
//       }
      
//       counter++;
//     } 
//   );
//   return mnemonicMap;
// };

// export const mnemonicFromObject = (mnemonicMap: string[]) => {
//   return mnemonicMap.reduce(
//     (prevWord, nextWord) => (prevWord ? prevWord + ' ' + nextWord : prevWord + nextWord),
//     ''
//   );
// };



export const SeedGeneratorScreen = ({navigation, route}: any) => {

  const isDarkMode = useColorScheme() === 'dark';
  const styles = makeStyles(isDarkMode);

  const worldList = Wordlist;

  const mnemonicToObject = (mnemonic: string, emptyMap: boolean = false): {word: string, index: number}[] => {
    const mnemonicMap = new Array<{word: string, index: number}>;
    var counter = 0;
    // Do not use this mnemonic object for other purposes than the flatList element.
    // We need to add the words alternately to show it "correctly".
    var mnemonicArray = !emptyMap ? mnemonic.split(' ') : new Array<string>();
    if (__DEV__) {
      mnemonicArray = emptyMap ? "sweet detail invest patient say spice lock rhythm bleak favorite sound neglect giant bounce slab smile monkey connect monitor bleak idle success tag crystal".split(' ') : mnemonic.split(' ');
    }
    setValidMnemonic(true);
    mnemonicArray.forEach((word, index) => {     
          mnemonicMap.push({word: word, index: index});
    })
    
    return mnemonicMap;
  };
  
  const mnemonicFromObject = (mnemonicMap: string[]) => {
    return mnemonicMap.reduce(
      (prevWord, nextWord) => (prevWord ? prevWord + ' ' + nextWord : prevWord + nextWord),
      ''
    );
  };

  // const isDarkMode = useColorScheme() === 'dark';
  
  // const styles = StyleSheet.create({
  //   container: {
  //     alignItems: 'center',
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
  const [restoreMode, setRestoreMode] = useState(false);
  const [validMnemonic, setValidMnemonic] = useState(false);
  
  const [checked, setChecked] = useState("unchecked" as "checked" | "unchecked" | "indeterminate");

  useEffect(() => {
    // storeCredentials("phill", "abc").then((result) => {
    //   Alert.alert(result == false ? "FALSE" : "TRUE1");
    // });
    // Keychain.resetGenericPassword();
    
    // var test = credentialsAvailable().then((result) => {
    //   if (result != false) {
    //     var test2 = result as Keychain.UserCredentials;
        
    //   } else {
    //       generate();
    //   }
      setRestoreMode(route.params?.restoreWallet);
      generateEntropy(route.params?.restoreWallet);      
    // });
    
  }, []);

  const [text, onChangeText] = React.useState('Useless Text');
  const [number, onChangeNumber] = React.useState(new Array<string>());
  
    // const history = useHistory();
    const [mnemonicInfo, setMnemonicInfo] = React.useState([] as {word: string, index: number}[]);
    const [mnemonic, setMnemonic] = React.useState("");

    const generateEntropy = (emptyFields: boolean = false) => {
      
      generateMnemonic(256).then((entropy: string) => {
        setMnemonic(entropy);
        const mnemonicMap = mnemonicToObject(entropy, emptyFields);
        setMnemonicInfo(mnemonicMap);
      });
    };
    
    // function mnemonicCorrectOrder(): string[] {
    //   if (Object.keys(mnemonicInfo).length == 0) {
    //     return new Array<string>;
    //   }
    //   mnemonicInfo.sort((i1, i2) => {
    //     return i1.index - i2.index;
    //   });
  
    //   return mnemonicInfo.map((item: {word:string, index: number}) => {
    //       return item.word;
    //   });
    // }

    const [loading, setLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState([] as any)
  const [suggestionsList, setSuggestionsList] = useState(new Array<{ id: string, title: string}>())
  const dropdownController = useRef(null)

  const searchRef = useRef<any|null>(null)

  const getSuggestions = useCallback(async (q: any) => {
    if (q == '' || (selectedItem == '' && q == '')) {
      setSuggestionsList([]);
      return;
    }
    
    var words = worldList.filter((word) => {
      return word.title.indexOf(q) == 0
    }).sort((w1, w2) => {
          if (w1.title.toLowerCase() > w2.title.toLowerCase()) return 1;
          if (w1.title.toLowerCase() < w2.title.toLowerCase()) return -1;
          return 0;
        });
        
    setSuggestionsList(words)
    
  }, [suggestionsList])

  const onClearPress = useCallback(() => {
    
  }, [])

  // const getSuggestions = useCallback(async (q: string) => {
  //   const filterToken = q.toLowerCase()
  //   console.log('getSuggestions', q)
  //   if (typeof q !== 'string' || q.length < 3) {
  //     setSuggestionsList(null)
  //     return
  //   }
  //   setLoading(true)
  //   const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  //   const items = await response.json()
  //   const suggestions = items
  //     .filter((item: any) => item.title.toLowerCase().includes(filterToken))
  //     .map(item: any) => ({
  //       id: item.id,
  //       title: item.title,
  //     }))
  //   setSuggestionsList(suggestions)
  //   setLoading(false)
  // }, [])

  const onOpenSuggestionsList = useCallback((isOpened: any) => {}, [])

  const [data, setData] = useState(["Test", "Blaa", "Blubb"])
    
    // const [checked, setChecked] = React.useState(false);

    return (
      <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView> 
    <View style={{paddingTop: 0}}>
      <View style={{alignSelf: 'center'}}>
        <View style={{alignSelf: 'center'}}>
            
            {/* <SvgXml xml={dataUriExample} width={75} height={75} fill={"#61DDBC"}  />   */}
            </View>
            <View style={[styles.container, {paddingTop: 20}]}>
              {!restoreMode ? <Text style={[styles.sectionTitle, {fontSize: 32}]}>Seed generator</Text> : <Text style={[styles.sectionTitle, {fontSize: 32}]}>Restore wallet</Text>}
            </View>
                            {/*             
                                        <FlatList data={mnemonicInfo} style={{paddingTop: 36, width: 264}} renderItem={({item, index}: {item: {word: string, index: number}, index: number}) => (
                                      <View
                                        style={{
                                          display: 'flex',
                                          flex: 1,
                                          flexWrap: 'wrap',
                                          flexDirection: 'row',
                                          margin: 1,
                                          width: 256,
                                      }}>
                                          <View style={{
                                            flex: 1,
                                            flexDirection: 'column',
                                            
                                            backgroundColor: Colors.light,
                                            borderRadius: 12
                                            
                                          }}>              
                                            {index %2 == 0 ? <View style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', height: 32}}><TextInput style={{alignItems: 'center', verticalAlign: 'middle', justifyContent: 'center', paddingTop: -18, color: 'black'}} editable={false}>{item.index + 1}.</TextInput><TextInput onChangeText={(newValue: string) => { restoreMode ? item.word = newValue : ""}} editable={restoreMode} style={{color: 'black', width: 164, flex: 1, paddingTop: -18}}>{item.word}</TextInput></View> : ""}
                                            {index %2 != 0 ? <View style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', height: 32}}><TextInput onChangeText={(newValue: string) => { restoreMode ? item.word = newValue : ""}} editable={restoreMode} style={{color: 'black', textAlign:'right', flex:1, width: 164, paddingTop: -18}}>{item.word}</TextInput><TextInput style={{alignItems: 'center', verticalAlign: 'middle', justifyContent: 'center', paddingTop: -18, color: 'black'}} editable={false}> .{item.index + 1}</TextInput></View> : ""}

                                          </View>
                                        
                                      </View>
                                    )}
                                    numColumns={2}        
                                    /> */}
          <View style={[!restoreMode ? {display: 'none'} : {}, {marginTop: 64, zIndex: 10}]}>
            <AutocompleteDropdown
              ref={searchRef}
              onChangeText={getSuggestions}
              clearOnFocus={true}
              closeOnBlur={true}
              closeOnSubmit={false}
              
              // onClear={() => {setSuggestionsList([])}}
              // initialValue={{ id: '2' }} // or just '2'
              onSelectItem={async (item) => {
                // Alert.alert(item?.id)
                
                if (item == undefined || mnemonicInfo.length == 24) {
                  return;
                }
                
                mnemonicInfo.push({word: item.title as string, index: mnemonicInfo.length + 1});
                
                item && setSelectedItem(item.id)
                
                await mnemonicToEntropy(mnemonicFromObject(mnemonicInfo.map((wordInfo) => wordInfo.word))).then((res: any) => {
                  setValidMnemonic(true);
                }).catch(() => {
                  setValidMnemonic(false);
                });
                if (mnemonicInfo.length < 24) {
                  searchRef.current?.focus();
                }
              }}
              onBlur={() => {setSelectedItem("")}}
              direction={Platform.select({ ios: 'down', android: 'down' })}
              dataSet={suggestionsList}
              // onChangeText={getSuggestions}
              onOpenSuggestionsList={onOpenSuggestionsList}
              suggestionsListMaxHeight={Dimensions.get('window').height * 1}
              inputContainerStyle={{                
                zIndex: 20
              }}
              suggestionsListContainerStyle={{     
                
              }}
              textInputProps={{
                placeholder: 'enter pass phrase',
                autoCorrect: false,
                autoCapitalize: 'none',
                style: {
                  // borderRadius: 25,
                  // backgroundColor: '#383b42',
                  color: '#010101',
                  paddingLeft: 18,
                },
              }}
              
            />
        </View>
        <View style={{flex: 1, flexWrap: 'wrap', marginTop: 24}}>
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', flex: 1, flexWrap: 'wrap'}}>
                { mnemonicInfo.length > 0 ?
                        mnemonicInfo.map((wordInfo: any) => {                          
                          return <View key={wordInfo.index} style={{backgroundColor: '#c0c0c0', padding: 8, margin: 3, borderRadius: 6 }} >
                                    <TouchableOpacity key={wordInfo.index} onPress={() => { wordInfo.index == mnemonicInfo.length ? setMnemonicInfo(mnemonicInfo.slice(0, mnemonicInfo.length - 1)) : "" }}><Text key={wordInfo.index}>{wordInfo.word}</Text></TouchableOpacity>
                                  </View>
                        }) :
                        ""
                  }
              </View>
        </View>
        <View style={{marginBottom: 24}}>
          <TouchableOpacity
              disabled={!validMnemonic && restoreMode}
              style={[styles.buttons, styles.buttonOpen, !validMnemonic && restoreMode ? {backgroundColor: '#a0a0a0', opacity: 0.8} : {}, {width: 164, alignSelf: 'center'}]}
              // onPress={() => WalletService.createWallet(mnemonicCorrectOrder(), "test", "test", "P4ssw0rd")}
              onPress={(validMnemonic && restoreMode) || ! restoreMode ? () => {setModalVisible(!modalVisible); setChecked("unchecked"); navigation.navigate('CreateAccount', {entropy: !restoreMode ? mnemonic : mnemonicFromObject(mnemonicInfo.map((wordInfo) => wordInfo.word))})} : () => {}}
          >
            {
              !restoreMode ? <Text style={{ color: Colors.darker }}>Create Wallet</Text> : <Text style={{ color: Colors.darker }}>Restore</Text>
            }
          </TouchableOpacity>
          </View>        
      </View>
    </View>
    </SafeAreaView>
    </TouchableWithoutFeedback >
    </KeyboardAvoidingView>
    );    
};

const svgDecoded = Buffer.from("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODYuMTcgNDk5Ljg2Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzM0OWVhMzt9PC9zdHlsZT48L2RlZnM+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cGF0aCBpZD0icGF0aDE2IiBjbGFzcz0iY2xzLTEiIGQ9Ik03My44Nyw1Mi4xNSw2Mi4xMSw0MC4wN0EyMy45MywyMy45MywwLDAsMSw0MS45LDYxLjg3TDU0LDczLjA5LDQ4Ni4xNyw0NzZaTTEwMi40LDE2OC45M1Y0MDkuNDdhMjMuNzYsMjMuNzYsMCwwLDEsMzIuMTMtMi4xNFYyNDUuOTRMMzk1LDQ5OS44Nmg0NC44N1ptMzAzLjM2LTU1LjU4YTIzLjg0LDIzLjg0LDAsMCwxLTE2LjY0LTYuNjh2MTYyLjhMMTMzLjQ2LDE1LjU3SDg0TDQyMS4yOCwzNDUuNzlWMTA3LjZBMjMuNzIsMjMuNzIsMCwwLDEsNDA1Ljc2LDExMy4zNVoiLz48cGF0aCBpZD0icGF0aDE4IiBjbGFzcz0iY2xzLTEiIGQ9Ik0zOC4yNywwQTM4LjI1LDM4LjI1LDAsMSwwLDc2LjQ5LDM4LjI3djBBMzguMjgsMzguMjgsMCwwLDAsMzguMjcsMFpNNDEuOSw2MS44YTIyLDIyLDAsMCwxLTMuNjMuMjhBMjMuOTQsMjMuOTQsMCwxLDEsNjIuMTgsMzguMTNWNDBBMjMuOTQsMjMuOTQsMCwwLDEsNDEuOSw2MS44WiIvPjxwYXRoIGlkPSJwYXRoMjAiIGNsYXNzPSJjbHMtMSIgZD0iTTQwNS43Niw1MS4yYTM4LjI0LDM4LjI0LDAsMCwwLDAsNzYuNDYsMzcuNTcsMzcuNTcsMCwwLDAsMTUuNTItMy4zQTM4LjIyLDM4LjIyLDAsMCwwLDQwNS43Niw1MS4yWm0xNS41Miw1Ni40YTIzLjkxLDIzLjkxLDAsMSwxLDguMzktMTguMThBMjMuOTEsMjMuOTEsMCwwLDEsNDIxLjI4LDEwNy42WiIvPjxwYXRoIGlkPSJwYXRoMjIiIGNsYXNzPSJjbHMtMSIgZD0iTTEzNC41OCwzOTAuODFBMzguMjUsMzguMjUsMCwxLDAsMTU3LjkyLDQyNmEzOC4yNCwzOC4yNCwwLDAsMC0yMy4zNC0zNS4yMlptLTE1LDU5LjEzQTIzLjkxLDIzLjkxLDAsMSwxLDE0My41NCw0MjZhMjMuOSwyMy45LDAsMCwxLTIzLjk0LDIzLjkxWiIvPjwvZz48L2c+PC9zdmc+", 'base64').toString('ascii');
const dataUriExample = "data:image/svg+xml;base64" + svgDecoded;