import { PlutusData, Address } from "@dcspark/cardano-multiplatform-lib-browser";
import { AssetClass } from "./AssetClass";
import { address_from_plutus_data } from "./addressUtils";
import { plutus_data_from_hex } from "./util";

type FarmParseOptions = {
  networkId: number;
};

export class FarmDatum {
  constructor(
    public owner: Address /* owner's whole address, TXes need to be signed by the pubkey */,
    public preferredStakePool: Buffer /* valid stakepool hash or h'00' if not chosen */,
    public farmToken: AssetClass /* token class that's farmed - lp token or WRT for boost */
  ) {}

  static from_hex(hexString: string, opts: FarmParseOptions): FarmDatum {
    return FarmDatum.from_plutus_data(plutus_data_from_hex(hexString), opts);
  }

  static from_plutus_data(pData: PlutusData, { networkId }: FarmParseOptions) {
    const constr = pData.as_constr_plutus_data()?.alternative();
    if (constr?.to_str() !== "0") {
      throw new Error("[FarmDatum] Invalid farming constructor");
    }
    const farmFields = pData.as_constr_plutus_data()?.data();

    if (!farmFields || farmFields.len() !== 3) {
      throw new Error("[FarmDatum] Invalid farming contract data");
    }

    const owner = address_from_plutus_data(networkId, farmFields.get(0));
    const preferredStakePool = Buffer.from(farmFields.get(1).as_bytes()!);
    const farmToken = AssetClass.from_plutus_data(farmFields.get(2));

    if (!owner || !preferredStakePool || !farmToken) {
      throw new Error("[FarmDatum] Some of the fields were not set");
    }

    return new FarmDatum(owner, preferredStakePool, farmToken);
  }
}
