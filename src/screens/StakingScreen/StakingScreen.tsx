import { Text } from "@react-native-material/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { getLatestEpochData } from "../../services/ApiConnectorService";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Dimensions, KeyboardAvoidingView, TouchableOpacity, View, useColorScheme } from "react-native";
import StakingImage from '../../assets/bagsofcoinscash.svg'; 
import { useStateValue } from "../../hooks/StateProvider";
import { makeStyles } from "../../../style";
import { AutocompleteDropdown } from "react-native-autocomplete-dropdown";
import EpochInfo from "../../types/LedgerData";

export const StakingScreen = ({navigation, route}: any) => {

    const [epochData, setEpochData] = useState<EpochInfo | undefined>(undefined);
    const [epochPercentage, setEpochPercentage] = useState<number>(0);
    const isDarkMode = useColorScheme() === 'dark';
    const styles = makeStyles(isDarkMode);
    const originalWidth = 1736.9767;
    const originalHeight = 736.37744;
    const aspectRatio = originalWidth / originalHeight;
    const windowWidth = Dimensions.get("window").width;
    const [{ initialLoadingReducer }, dispatch] = useStateValue();   

    useEffect(() => {
        dispatch({
            type: 'changeLoadingScreenVisibility',
            status: { loadingScreen: {visible: true, useBackgroundImage: false, opacity: 0.80} }
          });
        const getEpochData = async () => {
            const epochInfo = await getLatestEpochData()
            setEpochPercentage(Number((Number((Number(((Date.now()/1000) - epochInfo.start_time).toFixed()) / 432000).toFixed(4)) * 100).toFixed(2)))
            setEpochData(epochInfo);
            setInterval(() => {
                setEpochPercentage(Number((Number((Number(((Date.now()/1000) - epochInfo.start_time).toFixed()) / 432000).toFixed(4)) * 100).toFixed(2)))
            }, 1000)
            dispatch({
                type: 'changeLoadingScreenVisibility',
                status: { loadingScreen: {visible: false, useBackgroundImage: false, opacity: 0.80} }
              });
        }

        getEpochData();

    }, []);

    return  <>  
                { epochData ? 
                <KeyboardAvoidingView style={[{flex: 1 }, isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.lighter} ]}>
                        <View style={{paddingTop: 16, paddingHorizontal: 8}}>
                            <AutocompleteDropdown
                //   ref={searchRef}
                //   onChangeText={getSuggestions}
                clearOnFocus={true}
                closeOnBlur={true}
                closeOnSubmit={false}
                
                // onClear={() => {setSuggestionsList([])}}
                // initialValue={{ id: '2' }} // or just '2'
                //   onSelectItem={async (item) => {
                //     // Alert.alert(item?.id)
                    
                //     if (item == undefined || mnemonicInfo.length == 24) {
                //       return;
                //     }
                    
                //     mnemonicInfo.push({word: item.title as string, index: mnemonicInfo.length + 1});
                    
                //     item && setSelectedItem(item.id)
                    
                //     await mnemonicToEntropy(mnemonicFromObject(mnemonicInfo.map((wordInfo) => wordInfo.word))).then((res: any) => {
                //       setValidMnemonic(true);
                //     }).catch(() => {
                //       setValidMnemonic(false);
                //     });
                //     if (mnemonicInfo.length < 24) {
                //       searchRef.current?.focus();
                //     }
                //   }}
                //   onBlur={() => {setSelectedItem("")}}
                //   direction={Platform.select({ ios: 'down', android: 'down' })}
                //   dataSet={suggestionsList}
                // onChangeText={getSuggestions}
                //   onOpenSuggestionsList={onOpenSuggestionsList}
                suggestionsListMaxHeight={Dimensions.get('window').height * 1}
                inputContainerStyle={{                
                    zIndex: 20
                }}
                suggestionsListContainerStyle={{     
                    
                }}
                textInputProps={{
                    placeholder: '#MONKY',
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
                    
                    {/* <TouchableOpacity
                        
                        style={[styles.addButton, styles.button, styles.buttonOpen, {borderRadius: 64, borderWidth: 6, backgroundColor: Colors.lighter}, {borderColor: isDarkMode ? Colors.lighter : Colors.light}, {shadowColor: '#000', shadowOffset: {width: -30, height: 55}, shadowRadius: 128, elevation: 10, zIndex: 5}]}
                                onPress={() => {!initialLoadingReducer.status.offlineMessage.visible && navigation.navigate('CreateTransaction', {});}}
                        >
                            <IconButton icon="cube-send" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} />
                    </TouchableOpacity> */}
                    
                    <View style={[{ flexDirection: 'row', justifyContent: 'center', paddingTop: 64 }, isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.lighter} ]}>                        
                            <Text style={[{fontSize: 16}, isDarkMode ? {backgroundColor: Colors.darker} : {backgroundColor: Colors.lighter}]}>{epochData.epoch}</Text>      
                            
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', marginTop: 24 }}>
                        
                        <View style={{ alignItems: 'center'}}>
                            {/* <Text style={{color: Colors.light, justifyContent: 'center'}}>Staking</Text>         
                            <Text style={{color: Colors.light}}>{epochData.epoch}</Text> */}
                            <AnimatedCircularProgress
                            size={originalWidth / 10}
                            width={25}
                            fill={Number(epochPercentage)}
                            tintColor = {isDarkMode ? Colors.light : Colors.darker}
                            onAnimationComplete={() => console.log('onAnimationComplete')}
                            backgroundColor={isDarkMode ? Colors.dark : Colors.light}>
                                {
                                    (fill) => (
                                    <Text style={{color: Colors.light}}>
                                        {epochPercentage}%
                                    </Text>
                                    )
                                }
                            </AnimatedCircularProgress>
                        </View>
                        <View style={{ alignItems: 'center', marginTop: 12}}>
                            <Text style={{fontSize: 18, color: isDarkMode ? Colors.light : Colors.darker}}>Total staked</Text>
                            <View style={{}}>
                                <Text style={{fontSize: 28, color: isDarkMode ? Colors.light : Colors.darker}}>12.000 ADA</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'center', marginTop: 24, justifyContent: 'flex-end', flex: 0 }}>
                            <TouchableOpacity style={[styles.button, styles.buttonOpen, {borderWidth: 2, marginHorizontal: 24, backgroundColor: Colors.lighter}, {borderColor: isDarkMode ? Colors.lighter : Colors.light}, {shadowColor: '#000', shadowOffset: {width: -30, height: 55}, shadowRadius: 128, elevation: 10}]} onPress={() => {}}>
                                <Text style={{  color: Colors.darker, padding: 16 }}>COLLECT REWARDS</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ alignItems: 'center', marginTop: 24, justifyContent: 'flex-end', flex: 0 }}>
                            <Text style={{fontSize: 18, color: isDarkMode ? Colors.light : Colors.darker}}>321.143224 ADA</Text>
                        </View>
                        
                        <View style={{flex: 1, justifyContent: 'flex-end', alignContent: "stretch", marginBottom: -35 }}>                            
                            {/* <SvgUri width="100%" height="70%" uri="https://res.cloudinary.com/ddkjlbzg2/image/upload/v1677522805/1676656904gravure-bart-simpson-hands-ina-pocket-cartoon-3_q7utgp.svg"/>  */}
                            <StakingImage
                                viewBox={`0 0 ${originalWidth} ${originalHeight}`}
                                width="100%"
                                height="100%"                                
                            />                            
                        </View>
                    </View>
                </KeyboardAvoidingView>    
                :
                <></>
                }
            </>
  };