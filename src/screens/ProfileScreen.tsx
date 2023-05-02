import { Text } from "@react-native-material/core";

export const ProfileScreen = ({navigation, route}: any) => {
    return <Text>This is {route.params.name}'s profile</Text>;
  };