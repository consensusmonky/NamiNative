# NamiNative
The nami wallet chrome extension ported to react-native mobile app

<p align="center"><img width="200px" src="./src/assets/img/bannerBlack.svg"></img></p>

# NamiNative

NamiNative is a mobile wallet to interact with the Cardano blockchain. It's an open-source project and built by [**consensusMonky Pool**](https://consensusmonky.de).

### Testnet Preprod Version

[Download testnet version](./releases/NamiNative_v0.1.0_beta.apk)

Download the APK and create a new wallet or restore an existing one.
Currently the wallet is only connected to the preprod testnet.

The mainnet network will be added soon.

### Early version

As NamiNative is still in development, nevertheless it is important for to get your feedback.
We build a product that combines the best features of the Chrome version with your best practices and experience in Web3.
Every idea and feedback from the community is welcome and should be directly incorporated into the product.

### Supported dApp Dienay.io

You can test the WalletConnect integration on https://playground.dienay.io
The NFT Minter does not mint NFTs for now but locks UTxO at a ScriptAddress, which can only redeemed by the original signer.

### Supported OS

Currently we only support android.
iOS will be integrated in the future.

### Libraries

The wallet and transaction specific data is generated with the cardano-serialization lib mobile bridge especially made for react-native.
https://github.com/Emurgo/csl-mobile-bridge


### Upcoming features

- Native token support
- NFT standards CIP-25, CIP-68 etc.
- dApp connector
- Ledger support
- NFT Viewer
- and more

### Website

NamiNative by
[consensusMonky Pool](https://consensusmonky.de)

Ported from Nami Wallet (Chrome version) made by
[Berry Pool](https://pipool.online)<br/>