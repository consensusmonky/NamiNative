
import React, { useState } from 'react';
import { StyleSheet, TouchableNativeFeedback, View } from "react-native";
import { Button, Text } from 'react-native-elements';
import Modal from "react-native-modal";
import { Colors } from 'react-native/Libraries/NewAppScreen';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';

const PayScreenModal = () => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
    
      
        <View  style={{alignItems: 'center', marginTop: -15,  width: 64, height: 64, borderRadius: 50, backgroundColor: Colors.light, justifyContent: 'center'}}>
        <View style={{
            width: 64, 
            height: 64,
            borderRadius: 100, 
            overflow: 'hidden'
          }}>
        <Button onPress={() => {setModalVisible(true)}}
            buttonStyle={[styles.buttonStyle]}
            type='clear'
            titleStyle={[{color: Colors.darker, fontSize: 14}]}
            icon={
              <FontAwesome5 name={"ice-cream"} size={48} color={Colors.dark} />
            }
          />
          {/* <Text style={{color: 'white'}}>Ice</Text> */}
        </View>
      </View>
      
      <View>
        <Modal
          backdropOpacity={0.7}
          isVisible={modalVisible}
          onBackdropPress={() => setModalVisible(false)}
          style={styles.contentView}
        >
          
          <View style={[styles.content, {flexDirection: 'row', backgroundColor: Colors.lighter}]}>
            <View style={{alignItems: 'center', overflow: 'hidden', borderRadius:60 }}>              
                <Button buttonStyle={[styles.buttonStyle, {paddingHorizontal: 24, height: 82, width: 82}]}
                  title='ice'
                  iconPosition='top'
                  titleStyle={[{color: Colors.darker, fontSize: 14}]}
                  type='clear'
                  icon={
                    <FontAwesome5 name={"ice-cream"} size={32} color={Colors.darker} />
                  }></Button>
            </View>
            <View style={{alignItems: 'center', overflow: 'hidden', borderRadius: 100 }}>                            
              <Button buttonStyle={[styles.buttonStyle, {paddingHorizontal: 24, height: 82, width: 82}]}
                title='ice'
                iconPosition='top'
                titleStyle={[{color: Colors.darker, fontSize: 14}]}
                type='clear'
                  icon={
                    <FontAwesome5 name={"ice-cream"} size={32} color={Colors.darker} />
                  }></Button>
            </View>
            <View style={{alignItems: 'center', overflow: 'hidden', borderRadius: 100 }}>              
              <Button buttonStyle={[styles.buttonStyle, {paddingHorizontal: 24, height: 82, width: 82}]}
                title='ice'
                iconPosition='top'
                titleStyle={[{color: Colors.darker, fontSize: 14}]}
                type='clear'
                  icon={
                    <FontAwesome5 name={"ice-cream"} size={32} color={Colors.darker} />
                  }></Button>
            </View>
          </View>
          
        </Modal>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  content: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
  },
  contentTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  contentView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
	buttonStyle: {
     backgroundColor: Colors.light 
  }
});

export default PayScreenModal;