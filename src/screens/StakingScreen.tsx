import { Text } from "@react-native-material/core";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { getLatestEpochData } from "../services/NetworkDataProviderService";
import EpochInfo from "../types/EpochInfo";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Alert, Dimensions, TouchableOpacity, View, useColorScheme } from "react-native";
import Svg, { Circle, SvgUri, SvgXml } from "react-native-svg";
import StakingImage from '../assets/bagsofcoinscash.svg'; 
import { useStateValue } from "../hooks/StateProvider";
import { makeStyles } from "../../style";
import { IconButton } from "react-native-paper";

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
                <SafeAreaView style={{flex: 1 , backgroundColor: Colors.darker}}>
                    <TouchableOpacity
                        // style={styles.buttons}
                        // onPress={() => {navigation.navigate('SeedGenerator', {restoreWallet: true})}}
                        style={[styles.addButton, styles.button, styles.buttonOpen, {borderRadius: 64, borderWidth: 6, backgroundColor: Colors.lighter}, {borderColor: isDarkMode ? Colors.lighter : Colors.light}, {shadowColor: '#000', shadowOffset: {width: -30, height: 55}, shadowRadius: 128, elevation: 10, zIndex: 5}]}
                                onPress={() => {!initialLoadingReducer.status.offlineMessage.visible && navigation.navigate('CreateTransaction', {});}}
                        >
                        {/* <Text style={[isDarkMode ? {color: Colors.darker} : {color: Colors.darker}, {zIndex: 10}]}>+</Text> */}
                            <IconButton icon="cube-send" style={{backgroundColor: isDarkMode ? Colors.lighter : Colors.lighter}} />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', backgroundColor: Colors.darker, justifyContent: 'center', paddingTop: 64 }}>                        
                            <Text style={{color: Colors.light, fontSize: 32}}>{epochData.epoch}</Text>                        
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', marginTop: 24 }}>
                        
                        <View style={{ alignItems: 'center'}}>
                            {/* <Text style={{color: Colors.light, justifyContent: 'center'}}>Staking</Text>         
                            <Text style={{color: Colors.light}}>{epochData.epoch}</Text> */}
                            <AnimatedCircularProgress
                            size={200}
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
                        <View style={{width: windowWidth, flex: 1, justifyContent: 'flex-end', marginBottom: -50 }}>                            
                            {/* <SvgUri width="100%" height="70%" uri="https://res.cloudinary.com/ddkjlbzg2/image/upload/v1677522805/1676656904gravure-bart-simpson-hands-ina-pocket-cartoon-3_q7utgp.svg"/>  */}
                            <StakingImage
                                viewBox={`0 0 ${originalWidth} ${originalHeight}`}
                                width="100%"
                                height="100%"                                
                            />                            
                        </View>
                    </View>
                </SafeAreaView>    
                :
                <></>
                }
            </>
  };