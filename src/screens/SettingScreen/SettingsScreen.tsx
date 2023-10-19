import { Text, View, useColorScheme } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "react-native/Libraries/NewAppScreen";


export const SettingsScreen = ({navigation, route}: any) => {

    const isDarkMode = useColorScheme() === 'dark';

    return (
    <>
        <SafeAreaView style={[{flex: 1}, isDarkMode ? {backgroundColor: Colors.dark } : {backgroundColor : Colors.light }]}>
            <View style={{flex: 0, margin: 0}}>
                <Text style={{fontSize: 24, padding: 12}}>Settings</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row', margin: 0}}>
                <View style={[{flex: 1, flexDirection: 'row', padding: 6, paddingHorizontal: 16}, isDarkMode ? {backgroundColor: Colors.darker } : {backgroundColor : Colors.lighter }]}>
                    <View style={[{flex: 2, flexDirection: "column", padding: 0 }, isDarkMode ? {backgroundColor: Colors.darker } : {backgroundColor : Colors.lighter }]}>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800', color: 'white'}}>General</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Language</Text>
                            <Text style={{fontSize: 10}}>The language of the app</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Currency</Text>
                            <Text style={{fontSize: 10}}>The displayed conversion currency</Text>
                        </View>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800', color: 'white'}}>API</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Network endpoint</Text>
                            <Text style={{fontSize: 10}}>The cardano network communication endpoint</Text>
                        </View>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800', color: 'white'}}>Security</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Passcode</Text>
                            <Text style={{fontSize: 10}}>Manage your app access pin</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Biometrics</Text>
                            <Text style={{fontSize: 10}}>Activate phones biometrics</Text>
                        </View>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800', color: 'white'}}>Info</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 32}]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Version</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 32 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Developer</Text>
                        </View>
                    </View>
                    <View style={[{flex: 1 }, isDarkMode ? {backgroundColor: Colors.darker } : {backgroundColor : Colors.lighter }]}>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800'}}></Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>en-US</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>USD</Text>
                        </View>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24  }]}>
                            <Text style={{fontSize: 16, fontWeight: '800'}}></Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16, color: Colors.light, opacity: 0.3}}>Blockfrost.io</Text>
                        </View>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800'}}></Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16}}></Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 48 }]}>
                            <Text style={{fontSize: 16}}></Text>
                        </View>
                        <View style={[{ flex: 0, marginVertical: 6, height: 24 }]}>
                            <Text style={{fontSize: 16, fontWeight: '800'}}></Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 32 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>0.1.3b</Text>
                        </View>
                        <View style={[{ flex: 0, padding: 6, height: 32 }]}>
                            <Text style={{fontSize: 16, color: 'white'}}>Phillip Sailer</Text>
                        </View>
                    </View>
                </View>
            </View>
            
        </SafeAreaView>
    </>
    )
}