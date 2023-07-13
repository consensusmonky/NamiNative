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
                borderRadius: [15, 15, 0, 15],
                },
                topRight: {
                borderRadius: [15, 15, 15],
                },
                bottomLeft: {
                borderRadius: [15, 0, 15, 15],
                },
            }}
            innerEyesOptions={{
                borderRadius: 1,
                scale: 0.95,
            }}
            />
            :
            <></>
        }
        </>
};

export default QrCode;
