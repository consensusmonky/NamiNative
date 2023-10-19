import { BaseAddress, Bip32PrivateKey, decrypt_with_password, encrypt_with_password, NetworkInfo, PrivateKey, RewardAddress, StakeCredential } from "@emurgo/react-native-haskell-shelley";
import { mnemonicToEntropy } from '@mfellner/react-native-bip39';
// import { mnemonicFromObject } from "../screens/SeedGeneratorScreen";
import { generateSecureRandom } from "react-native-securerandom";
import { Buffer } from "buffer";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { ERROR, NETWORK_ID, NODE, STORAGE } from "../constants/Common";
import { AccountInfo, NetworkDefaultStats } from "../types/Network";
import { Network } from "../types/Network";
import { Wallet } from "../storage/Wallet";

export type WalletServiceProvider = {
    createWallet(mnemonic: string, password: string): Promise<void>;
    createAccount(name: string, password: string, accountIndex: number | null): Promise<void>;
    getWalletAddress(password: string, accountIndex: number): Promise<string>;
}

export const WalletService : WalletServiceProvider = {
    async createWallet(mnemonic: string, password: string): Promise<void> {
        let blankRootKey = await generatePrivateKey(mnemonic) as Bip32PrivateKey;
        
        // var existingEncryptedKey = await AsyncStorage.getItem(STORAGE.encryptedKey);
        var existingEncryptedKey = Wallet.getString(STORAGE.encryptedKey);
        if (existingEncryptedKey) {
            throw new Error(ERROR.storeNotEmpty);
        }

        const encryptedRootKey = await encryptWithPassword(password, (await blankRootKey?.as_bytes()).buffer).catch((error: string) => {
            console.log(error)
        }) as string;

        // await AsyncStorage.setItem(STORAGE.encryptedKey, encryptedRootKey);
        Wallet.setString(STORAGE.encryptedKey, encryptedRootKey);

        // await AsyncStorage.removeItem(STORAGE.selectedNetwork);
        // await AsyncStorage.removeItem(STORAGE.usedCurrency);

        Wallet.removeItem(STORAGE.selectedNetwork);
        Wallet.removeItem(STORAGE.usedCurrency);
        // await AsyncStorage.setItem(STORAGE.selectedNetwork, `{id: "${NETWORK_ID.testnet}", node: "${NODE.testnet}" }`);
        var networkConfig: Network = 
        {
          id: NETWORK_ID.preprod,
          node: NODE.preprod,
          name: STORAGE.selectedNetwork,
          mainnetSubmit: "",
          preprodSubmit: "",
          previewSubmit: "",
        }    

        // AsyncStorage.setItem(STORAGE.selectedNetwork, JSON.stringify(networkConfig));
        // await AsyncStorage.setItem(STORAGE.usedCurrency, "usd");
        Wallet.setMap(STORAGE.selectedNetwork, networkConfig);
        Wallet.setString(STORAGE.usedCurrency, "usd");
    },

    async createAccount(name: string, password: string, accountIndex: number | null = null): Promise<void> {

        // TODO: Save within AsyncStorage and move to createAccount function.
        // let existingAccountsJson = await AsyncStorage.getItem(STORAGE.accounts);
        // let existingAccountsJson = Wallet.getString(STORAGE.accounts)
        //let existingAccounts: Array<Account> = existingAccountsJson ? JSON.parse(existingAccountsJson) as Array<Account> : new Array<Account>();

        const index = 0;
        // const index = accountIndex
        // ? accountIndex
        // : existingAccounts
        // ? Object.keys(getNativeAccounts(existingAccounts)).length
        // : 0;

        const { accountKey_1852_1815_0, paymentKey, stakeKey } = await requestAccountKey(password, accountIndex ?? 0);

        // BIP32 Public key
        const publicAddress = await(await accountKey_1852_1815_0.to_public())?.as_bytes();
        const publicKey = Buffer.from(publicAddress)?.toString("hex");
        const paymentKeyPub = await paymentKey?.to_public();
        const stakeKeyPub = await stakeKey?.to_public();

        const paymentKeyPubHash = await paymentKeyPub.hash();        

        const paymentKeyHash = await(Buffer.from(await paymentKeyPubHash.to_bytes())).toString('hex');
        const paymentKeyHashBech32 = (await (paymentKeyPubHash)?.to_bech32('addr_vkh')) as string;

        const stakeKeyPubHash = await stakeKeyPub.hash();
        const stakeKeyHash = await (Buffer.from(await stakeKeyPubHash.to_bytes())).toString('hex');
        const paymentKeyStakeCredential = await StakeCredential.from_keyhash(paymentKeyPubHash);
        const stakeKeyStakeCredential = await StakeCredential.from_keyhash(stakeKeyPubHash);
        const mainnetNetworkId = await (await NetworkInfo.mainnet()).network_id();
        const preprodNetworkId = await (await NetworkInfo.testnet_preprod()).network_id();
        const previewNetworkId = await (await NetworkInfo.testnet_preview()).network_id();

        const paymentAddrMainnet = (await (await (await (await BaseAddress.new(
            mainnetNetworkId,
            paymentKeyStakeCredential,
            stakeKeyStakeCredential
        )).to_address())).to_bech32("addr")) as string;

        const rewardAddrMainnet = (await(await (await RewardAddress.new(
            mainnetNetworkId,
            stakeKeyStakeCredential
            )).to_address())
            .to_bech32("stake")) as string;

        const paymentAddrPreprodTestnet = (await (await (await (await BaseAddress.new(
            preprodNetworkId,
            paymentKeyStakeCredential,
            stakeKeyStakeCredential
            )).to_address())).to_bech32("addr_test")) as string;        

        const rewardAddrPreprodTestnet = (await(await (await RewardAddress.new(
            preprodNetworkId,
            stakeKeyStakeCredential
            )).to_address())
            .to_bech32("stake_test")) as string;

        const paymentAddrPreviewTestnet = (await (await (await (await BaseAddress.new(
            previewNetworkId,
            paymentKeyStakeCredential,
            stakeKeyStakeCredential
            )).to_address())).to_bech32("addr_test")) as string;        

        const rewardAddrPreviewTestnet = (await(await (await RewardAddress.new(
            previewNetworkId,
            stakeKeyStakeCredential
            )).to_address())
            .to_bech32("stake_test")) as string;

        const networkDefault: NetworkDefaultStats | null = {
                lovelace: "0",
                minAda: "0",
                assets: [],
                history: { confirmed: [], details: {} },
                paymentAddr: "",
                rewardAddr: "",
                collateral: {} as any,
                recentSendToAddresses: ""

        };
        const newAccount : AccountInfo = 
        {
            name: name,
            publicKey: publicKey,
            paymentKeyHash: paymentKeyHash,
            paymentKeyHashBech32: paymentKeyHashBech32,
            stakeKeyHash: stakeKeyHash,
            avatar: Math.random().toString(),
            mainnet: {
                ...networkDefault,
                paymentAddr: paymentAddrMainnet,
                rewardAddr: rewardAddrMainnet,
            },
            preprod: {
                ...networkDefault,
                paymentAddr: paymentAddrPreprodTestnet,
                rewardAddr: rewardAddrPreprodTestnet,
            },
            preview: {
                ...networkDefault,
                paymentAddr: paymentAddrPreprodTestnet,
                rewardAddr: rewardAddrPreprodTestnet,
            }        
        };

        
        
        //var serializedAccount = JSON.stringify(newAccount)        
        // await AsyncStorage.setItem(STORAGE.accounts, serializedAccount);
        Wallet.setArray(STORAGE.accounts, [newAccount]);
        
        //  const finalEncryptedRootKey = existingWallet ?? encryptedRootKey;
        
        
        // var rootKeyHex = Buffer.from((await rootKey?.as_bytes()).buffer).toString('hex');
        
        // entropy = "";
        // password = "";
        // encryptedRootKey.f
    },

    async getWalletAddress(password: string, accountIndex?: number): Promise<string> {
        
            
        return "";
    }
}

export const requestAccountKey = async (password: string, accountIndex: number): Promise<{
    accountKey_1852_1815_0: Bip32PrivateKey,
    paymentKey: PrivateKey,
    stakeKey: PrivateKey,
}> => {
    let wallet = Wallet.getString(STORAGE.encryptedKey);        
    if (wallet == undefined || wallet == null) {
        throw Error("No wallet found");
    }

    let encryptedRootKey = wallet;   
    let decryptedRootKey = await decryptWithPassword(password, encryptedRootKey);        
    
    var accountKey = await Bip32PrivateKey.from_bytes(
        Buffer.from(decryptedRootKey, 'hex')
    ) as Bip32PrivateKey
    
    let accountKey1852 = await accountKey?.derive(harden(1852)); // Purpose
    let accountKey_1852_1815 = await accountKey1852?.derive(harden(1815)) // SLIPS - ADA
    let accountKey_1852_1815_0 = await accountKey_1852_1815?.derive(harden(accountIndex)); // Account
    
    // Payment Key
    let accountKey_1852_1815_0_0 = await accountKey_1852_1815_0?.derive(0); // Role - ExternalChain
    let accountKey_1852_1815_0_0_0 = await (await accountKey_1852_1815_0_0.derive(0))?.to_raw_key();
    let paymentKey = accountKey_1852_1815_0_0_0;
    
    // Stake Key
    let accountKey_1852_1815_0_2 = await accountKey_1852_1815_0?.derive(2); // Role - StakeAddress
    let accountKey_1852_1815_0_2_0 = await (await accountKey_1852_1815_0_2?.derive(0))?.to_raw_key();
    let stakeKey = accountKey_1852_1815_0_2_0;
    
    let walletAccountCredentials =  {
        accountKey_1852_1815_0,
        paymentKey:  paymentKey,
        stakeKey: stakeKey,
    };
    
    return walletAccountCredentials
}
        

export const generatePrivateKey = async (mnemonic: string): Promise<Bip32PrivateKey | void> => {
    
    let entropy: string = "";    
    entropy = await mnemonicToEntropy(mnemonic);    
    let rootKey = await Bip32PrivateKey.from_bip39_entropy(Buffer.from(entropy, 'hex'), Buffer.from(""));    
    entropy = "";

    return rootKey;
}
    
export const encryptWithPassword = async (password: string, rootKeyBytes: ArrayBuffer): Promise<string> => {
    let rootKeyHex = Buffer.from(rootKeyBytes).toString('hex');
    let passwordHex = password != "" ? Buffer.from(password).toString('hex') : new Uint8Array().toString();

    rootKeyBytes = Buffer.from("");

    let salt = await generateSecureRandom(32);
    let nonce = await generateSecureRandom(12);

    let hexSalt = Array.from(salt).map((utf8Char) => utf8Char.toString(16).padStart(2, "0")).join("");
    let hexNonce = Array.from(nonce).map((utf8Char) => utf8Char.toString(16).padStart(2, "0")).join("");      

    var encryptedRootKey = await encrypt_with_password(
        passwordHex,
        hexSalt,
        hexNonce,
        rootKeyHex
    ).catch((error: string) => {
        console.error(error)
    }) as string;

    rootKeyHex = hexSalt = hexNonce = passwordHex = "";
    salt = new Uint8Array();
    nonce = new Uint8Array();

    return encryptedRootKey;      
};

export const harden = (num: number) => {
    return 0x80000000 + num;
};

export const decryptWithPassword = async (password: string, encryptedHex: string) => {
    let passwordHex = Buffer.from(password).toString('hex');

    let decryptedHexKey;
    
    try {
    decryptedHexKey = await decrypt_with_password(
        passwordHex,
        encryptedHex
    ) as string;
    } catch (err) {
    throw new Error("Wrong Wallet Password");
    }

    return decryptedHexKey;
};

// export const getNativeAccounts = (accounts: AccountInfo[]) => {
//     const nativeAccounts: AccountInfo[] = new Array<AccountInfo>();
//     Object.keys(accounts)
//       .filter((accountIndex) => !isHW(accountIndex))
//       .forEach(
//             (account, accountIndex) => nativeAccounts.push(accounts[accountIndex])
//         );
//     return nativeAccounts;
// };

export const isHW = (accountIndex: string) =>
  accountIndex != null &&
  accountIndex != undefined &&
  accountIndex != "0" &&
  typeof accountIndex !== 'number' &&
  (accountIndex.startsWith(HW.trezor) || accountIndex.startsWith(HW.ledger));




  

  