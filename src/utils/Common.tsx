import crc from 'crc';

export const dateFromUnix = (unixTimestamp: number) => {
    return new Date(unixTimestamp * 1000);
};

export const checksum = (num: any) => {
    return crc.crc8((Buffer.from(num, 'hex'))).toString(16).padStart(2, '0');
}

export async function delay(delayInMs: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
        resolve(true);
        }, delayInMs);
    });
}