

export const dateFromUnix = (unixTimestamp: number) => {
    return new Date(unixTimestamp * 1000);
};