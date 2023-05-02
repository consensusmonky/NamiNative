import React from 'react';
import QRCodeStyled from 'react-native-qrcode-styled';

const QrCode = ({ value }: {value: string}) => {
  return <>
    {value?.length > 0 ? 
    <QRCodeStyled
            data={value}
            // style={styles.svg}
            padding={20}
            pieceSize={6}
            pieceBorderRadius={4}
            logo={{
                href: require('../assets/ada.png'),
                padding: 3,
                scale: 1,
            }}
            gradient={{
                type: 'radial',
                options: {
                center: [0.5, 0.5],
                radius: [1, 1],
                colors: ['#006462',],
                locations: [0, 1],
                },
            }}
            outerEyesOptions={{
                topLeft: {
                borderRadius: [20, 20, 0, 20],
                },
                topRight: {
                borderRadius: [20, 20, 20],
                },
                bottomLeft: {
                borderRadius: [20, 0, 20, 20],
                },
            }}
            innerEyesOptions={{
                borderRadius: 12,
                scale: 0.85,
            }}
            />
            :
            <></>
        }
        </>
};

export default QrCode;
