import { Ed25519KeyHash, hash_transaction, make_vkey_witness, PublicKey, Transaction, TransactionBody, TransactionWitnessSet, Vkeywitness, Vkeywitnesses } from "@emurgo/react-native-haskell-shelley";
import { TxSignError } from "../config/config";
import { requestAccountKey } from "./WalletServiceProvider";
import { Buffer } from "buffer";

export const signTx = async (
    txHash: any,
    keyHashes: any,
    password: any,
    accountIndex: any,
    partialSign = false
  ) => {
    let { paymentKey, stakeKey } = await requestAccountKey(
      password,
      accountIndex
    );
    const paymentKeyHash = Buffer.from((await((await ((await paymentKey.to_public()) as PublicKey).hash()) as Ed25519KeyHash).to_bytes()) as Uint8Array).toString('hex');
    const stakeKeyHash = Buffer.from((await((await ((await stakeKey.to_public()) as PublicKey).hash()) as Ed25519KeyHash).to_bytes()) as Uint8Array).toString('hex');
    const txWitnessSet = (await TransactionWitnessSet.new()) as TransactionWitnessSet;
    const vkeyWitnesses = (await Vkeywitnesses.new()) as Vkeywitnesses;
    await Promise.all(
        keyHashes.map(async (keyHash: any) => {            
          
            let signingKey;
            if (keyHash === paymentKeyHash) signingKey = paymentKey;
            else if (keyHash === stakeKeyHash) signingKey = stakeKey;
            else if (!partialSign) throw TxSignError.ProofGeneration;
            
            let  vkey = (await make_vkey_witness(txHash, paymentKey)) as Vkeywitness;
            await vkeyWitnesses.add(vkey);
            
        }
    ));
    
    stakeKey.free();
    // stakeKey = null;
    paymentKey.free();
    // paymentKey = null;
  
    await txWitnessSet.set_vkeys(vkeyWitnesses);
    return txWitnessSet;
  };