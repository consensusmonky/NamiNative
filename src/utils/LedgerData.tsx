import { getBlock, getCurrentAccount, getNetwork, getTxInfo, getTxMetadata, getTxUTxOs } from '../services/ApiConnectorService';
import { AccountInfo } from '../types/Network';
import { checksum } from './Common';
import { Address, BigNum, TransactionHash, TransactionInput, TransactionOutput, TransactionUnspentOutput } from "@emurgo/react-native-haskell-shelley";
import { assetsToValue } from "../services/ApiConnectorService";
import { Buffer } from "buffer";

/**
 * Sum up all required output to a flat amount list
 * @param {OutputList} outputList - The set of outputs requested for payment.
 * @return {AmountList} - The sumed up list of amounts requested for payment.
 */
export const sumUpOutputs = (outputList: any) => {
  let sumedUpList: any = [];

  outputList.forEach((output: any) => addAmounts(output.amount, sumedUpList));

  return sumedUpList;
};
  
/**
 * Add up an AmountList values to an other AmountList
 * @param {AmountList} amountList - Set of amounts to be added.
 * @param {SumedUpList} sumedUpList - The sumed up list of amounts.
 */
function addAmounts(amountList: any, sumedUpList: any) {
  amountList.forEach((amount: any) => {
    let entry = sumedUpList.find(
    (compiledAmount: any) => compiledAmount.unit === amount.unit
    );

    // 'Add to' or 'insert' in compiledOutputList
    const am = JSON.parse(JSON.stringify(amount)); // Deep Copy
    entry
    ? (entry.quantity = (
        BigInt(entry.quantity) + BigInt(amount.quantity)
        ).toString())
    : sumedUpList.push(am);
  });
}

export function fromLabel(label: any) {
  if (label.length !== 8 || !(label[0] === '0' && label[7] === '0')) {
      return null;
  }

  const numHex = label.slice(1, 5);
  const num = parseInt(numHex, 16);
  const check = label.slice(5, 7);
  return check === checksum(numHex) ? num : null;
}

export function toAssetUnit(policyId: any, name: any, label: any) {
  const hexLabel = Number.isInteger(label) ? toLabel(label) : '';
  const n = name ? name : '';
  if ((n + hexLabel).length > 64) {
    throw new Error('Asset name size exceeds 32 bytes.');
  }
  if (policyId.length !== 56) {
    throw new Error(`Policy id invalid: ${policyId}.`);
  }
  return policyId + hexLabel + n;
}

export function toLabel(num: any) {
if (num < 0 || num > 65535) {
  throw new Error(
  `Label ${num} out of range: min label 1 - max label 65535.`
  );
}
const numHex = num.toString(16).padStart(4, '0');
  return '0' + numHex + checksum(numHex) + '0';
}

export function fromAssetUnit(unit: any) {
  const policyId = unit.slice(0, 56);
  const label = fromLabel(unit.slice(56, 64));
  const name = (() => {
    const hexName = Number.isInteger(label) ? unit.slice(64) : unit.slice(56);
    return unit.length === 56 ? "" : hexName || null;
  })();
  return { policyId, name, label };
}

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

export const calculateAmount = (currentAddr: any, uTxOList: any, validContract = true) => {
  if (!uTxOList) {
      return;
  }
  
  let inputs = sumUpOutputs(
    uTxOList.inputs.filter(
      (input: any) =>
        input.address === currentAddr && !(input.collateral && validContract)
    )
  );

  let outputs = sumUpOutputs(
    uTxOList.outputs.filter(
      (output: any) =>
        output.address === currentAddr && !(output.collateral && validContract)
    )
  );
  
  let amounts = [];

  while (inputs.length) {
    let input = inputs.pop();
    let outputIndex = outputs.findIndex((amount: any) => amount.unit === input.unit);
    let qty;

    if (outputIndex > -1) {
      qty =
        (BigInt(input.quantity) - BigInt(outputs[outputIndex].quantity)) *
        BigInt(-1);
      outputs.splice(outputIndex, 1);
    } else {
      qty = BigInt(input.quantity) * BigInt(-1);
    }

    if (qty !== BigInt(0) || input.unit === 'lovelace')
      amounts.push({
        unit: input.unit,
        quantity: qty,
      });
  }

  return amounts.concat(outputs);
};

export const getTxDetail = async (txHash: any, offlineMode = false) => {
  const currentAccount = getCurrentAccount() as AccountInfo;
  const currentNetwork = getNetwork();
  
  let detail = currentAccount[currentNetwork.id]?.history?.details[txHash];

  if (typeof detail !== 'object' || Object.keys(detail).length < 4 && !offlineMode) {
    detail = {};
    const info = await getTxInfo(txHash);
    const uTxOs = await getTxUTxOs(txHash);
    const metadata = await getTxMetadata(txHash);

    detail.info = await info;
    if (info) detail.block = await getBlock(detail.info.block_height);
    detail.utxos = await uTxOs;
    detail.metadata = await metadata;
  }

  return detail;
};