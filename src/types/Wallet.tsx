import { Address, Credential, Datum, DatumHash, Delegation, OutRef, ProtocolParameters, RewardAddress, Transaction, TxHash, UTxO, Unit } from "./LedgerData";

export interface Provider {
    getProtocolParameters(): Promise<ProtocolParameters>;
    /** Query UTxOs by address or payment credential. */
    getUtxos(addressOrCredential: Address | Credential): Promise<UTxO[]>;
    /** Query UTxOs by address or payment credential filtered by a specific unit. */
    getUtxosWithUnit(
      addressOrCredential: Address | Credential,
      unit: Unit,
    ): Promise<UTxO[]>;
    /** Query a UTxO by a unit. It needs to be an NFT (or optionally the entire supply in one UTxO). */
    getUtxoByUnit(unit: Unit): Promise<UTxO>;
    /** Query UTxOs by the output reference (tx hash and index). */
    getUtxosByOutRef(outRefs: Array<OutRef>): Promise<UTxO[]>;
    getDelegation(rewardAddress: RewardAddress): Promise<Delegation>;
    getDatum(datumHash: DatumHash): Promise<Datum>;
    awaitTx(txHash: TxHash, checkInterval?: number): Promise<boolean>;
    submitTx(tx: Transaction): Promise<TxHash>;
  }