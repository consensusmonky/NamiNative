import React, { useLayoutEffect, useState } from 'react';
import { SvgXml } from 'react-native-svg';
import { useStateValue } from '../../hooks/StateProvider';
import { getAvatar } from '../../utils/UserInterface';

type AvatarOptions = {
  avatarRadnomNumber: string | undefined;
  width: number;
  smallRobot: boolean;
  onAvatarReady: () => void;
}

const AvatarBox = ({ onAvatarReady, avatarRadnomNumber, width, smallRobot }: AvatarOptions) => {
const [avatar, setAvatar] = useState("");
const [{ _ }, dispatch] = useStateValue();

  const fetchAvatar = async () => {    
    if (!avatarRadnomNumber) {
        return;
    }
    
    await setAvatar(Number(avatarRadnomNumber) ? await getAvatar(avatarRadnomNumber) : await getAvatar(undefined));

  };

  const runAfterRender = () => {
    
  }

  useLayoutEffect(() => {
    
  },[]);
  
  React.useEffect(() => {
    // dispatch({
    //     type: 'changeLoadingScreenVisibility',
    //     loadingScreen: {visible: true}
    //   });
    fetchAvatar().then(() => {
      onAvatarReady();
        // setTimeout(() => {
        //     dispatch({
        //         type: 'changeLoadingScreenVisibility',
        //         status: { loadingScreen: {visible: false} }
        //       });
        // }, 2000)
        
    });

   
    
  }, [avatarRadnomNumber]);
  return (
    avatar ?
    <>
        <SvgXml xml={avatar} width={`${Number(avatarRadnomNumber) && smallRobot ? width*0.85 : width}`} height={`${Number(avatarRadnomNumber) && smallRobot ? width*0.85 : width}`} fill={"#61DDBC"} onLoad = {runAfterRender} />        
    </>
    :
    <></>
  );
};

export default AvatarBox;
