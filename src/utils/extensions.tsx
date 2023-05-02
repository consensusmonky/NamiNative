import { Address, BigNum, TransactionHash, TransactionInput, TransactionOutput, TransactionUnspentOutput } from "@emurgo/react-native-haskell-shelley";
import { assetsToValue } from "../services/NetworkDataProviderService";
import { Buffer } from "buffer";
import { Alert } from "react-native";

/**
 *
 * @param {JSON} output
 * @param {BaseAddress} address
 * @returns
 */
export const utxoFromJson = async (utxo: any, addressHex: any) => {
    
    var buffer = await Buffer.from(utxo.tx_hash || utxo.txHash, 'hex');
    var txHash = (await TransactionHash.from_bytes(buffer)) as TransactionHash
    var input = (await TransactionInput.new(txHash, utxo.output_index ?? utxo.txId)) as TransactionInput
    
    var addressBuffer = await Buffer.from(addressHex, 'hex');
    var address = (await Address.from_bytes(addressBuffer)) as Address
    
    var value = await assetsToValue(utxo.amount);    
    var output = await TransactionOutput.new(address, value) as TransactionOutput
    
    return (await TransactionUnspentOutput.new(input, output)) as TransactionUnspentOutput;
  };


  export const hexToAscii = (hex: string) => Buffer.from(hex, 'hex').toString();

