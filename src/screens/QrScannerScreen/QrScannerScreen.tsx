'use strict';

import "react-native-reanimated";
import React, { Component, useEffect } from 'react';
// import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';

import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  View,
  Dimensions
} from 'react-native';
// import { Camera,  useCameraDevices } from "react-native-vision-camera";

import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';

export default function QrScannerScreen({hideScanner, navigation}: {hideScanner: () => void, navigation: any}) {
    
    // const devices = useCameraDevices()
    // const device = devices.back
    
    // const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    //     checkInverted: true,
    //   });

    useEffect(() => {
        const init = async () => {
            // const newCameraPermission = await Camera.requestCameraPermission();
            // const newMicrophonePermission = await Camera.requestMicrophonePermission();

            
        }
        init();
    }, [])

    // useEffect(() => {
    //     openQrCode(barcodes[0]);
    // }, [barcodes])

    const onSuccess = (e: any) => {
      if (e.data.indexOf("addr") >= 0) {
        navigation.navigate('CreateTransaction', {walletAddress: e.data});
        hideScanner();
        return;
    }
    Linking.openURL(e.data).catch(err =>
        {
            // hideScanner();
            console.error('An error occured', err)
            return;
        }        
    ).finally(() => {
        hideScanner();
        return;
    });
    };
    
    // const openQrCode = (code: any) => {
    //     if (code.indexOf("addr") >= 0) {
    //         navigation.navigate('CreateTransaction', {walletAddress: code});
    //         hideScanner();
    //         return;
    //     }
    //     Linking.openURL(code).catch(err =>
    //         {
    //             hideScanner();
    //             console.error('An error occured', err)
    //         }        
    //     ).finally(() => {
    //         hideScanner();
    //     });
    // };

    const onClose = (e: any) => {
        hideScanner();
    }

    // if (device == null) return <><View><Text>Loading</Text></View></>
    // return (
    // <View style={{alignItems: 'center'}}>
    //     <View style={{borderRadius: 10, overflow:'hidden'}}>
    //     {/* <Camera
    //       style={[{width: Dimensions.get('window').width - 50, height: (Dimensions.get('window').width / 16 * 15)}]}
    //       device={device}
    //       isActive={true}
    //       frameProcessor={frameProcessor}
    //       frameProcessorFps={5}
    //     /> */}
    //     </View>
    //     <View>
    //         <TouchableOpacity style={[styles.buttonTouchable]} onPress={onClose}>
    //             <Text style={styles.buttonText}>close</Text>
    //         </TouchableOpacity>
    //     </View>
    // </View>
    // )
  
    return (
       <View style={{alignItems: 'center'}}>
         <View style={{borderRadius: 10, overflow:'hidden'}}>
            <QRCodeScanner
              onRead={onSuccess}
              flashMode={RNCamera.Constants.FlashMode.off}
              fadeIn={true}
              containerStyle={{alignItems: 'center'}}
              cameraStyle={{overflow:'hidden', width: 300, borderRadius: 20}}
              topViewStyle={{height: 0}}
              bottomViewStyle={{height: 0}}
              reactivate={true}
              bottomContent={
                <TouchableOpacity style={[styles.buttonTouchable]} onPress={onClose}>
                      <Text style={styles.buttonText}>close</Text>
                  </TouchableOpacity>
              }
            />
         </View>
     </View>
    );
    
  
}

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777'
  },
  textBold: {
    fontWeight: '500',
    color: '#000'
  },
  buttonText: {
    fontSize: 16,
    color: 'rgb(222,222,222)'
  },
  buttonTouchable: {
    padding: 16,
  }
});

AppRegistry.registerComponent('default', () => QrScannerScreen);