import { useEffect } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

/*
  Adding new global colors to NewAppScreen.
*/
Colors["darkred"] = '#cc2233';

export const makeStyles = (isDarkMode: boolean) => StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    buttons: {
      backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
      padding: 10,
      margin: 5,
      borderRadius: 6,   
      alignItems: 'center'
    },

    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    modalView: {
      margin: 20,
      backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    button: {
      borderRadius: 20,
      elevation: 2,
    },
    buttonOpen: {
      backgroundColor: '#61DDBC',
    },
    buttonClose: {
      backgroundColor: '#61DDBC',
    },
    addButton: {      
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: '#61DDBC',
      color: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      width: 64,
      height: 64,
      right: 35,
      bottom: 35,
    },
    textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    modalText: {
      marginBottom: 15,
      textAlign: 'center',
    },
    input: {
      height: 32,
      fontSize: 12,
      margin: 6,
      width: 264,
      borderWidth: 1,
      padding: 0,
      paddingLeft: 10,
      borderColor: '#aaa',
    },

    sectionTitle:
    {
      color: isDarkMode ? Colors.light : Colors.dark
    },

    backgroundTheme:
    {
      backgroundColor: isDarkMode ? Colors.darker : Colors.lighter
    }
  });