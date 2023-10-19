import { Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export const LootScreen = ({navigation, route}: any) => {

    return (
    <>
        <SafeAreaView>
            <View>
                <Text>no loot available</Text>
            </View>
        </SafeAreaView>
    </>
    )
}