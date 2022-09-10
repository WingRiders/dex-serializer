import { PlutusData, Address, BigInt } from "@dcspark/cardano-multiplatform-lib-browser";
import { AssetClass } from "./AssetClass";
import { address_from_plutus_data } from "./addressUtils";
import { plutus_data_from_hex } from "./util";

type VestingParseOptions = {
  networkId: number;
};

export class VestingDatum {
  constructor(
    public beneficiary: Address,
    public vestingAsset: AssetClass,
    public totalVestingQty: BigInt,
    public vestingPeriodStart: BigInt,
    public vestingPeriodEnd: BigInt,
    public vestingUnlock: BigInt,
    public totalInstallments: BigInt,
    public vestingMemo: Uint8Array
  ) {}

  static from_hex(hexString: string, opts: VestingParseOptions): VestingDatum {
    return VestingDatum.from_plutus_data(plutus_data_from_hex(hexString), opts);
  }

  static from_plutus_data(pData: PlutusData, { networkId }: VestingParseOptions) {
    const constr = pData.as_constr_plutus_data()?.alternative();
    if (constr?.to_str() !== "0") {
      throw new Error("[VestingDatum] Invalid vesting constructor");
    }
    const vestingFields = pData.as_constr_plutus_data()?.data();

    if (!vestingFields || vestingFields.len() !== 8) {
      throw new Error("[VestingDatum] Invalid vesting contract data");
    }

    const beneficiary = address_from_plutus_data(networkId, vestingFields.get(0));
    const vestingAsset = AssetClass.from_plutus_data(vestingFields.get(1));
    const vestingQty = vestingFields.get(2).as_integer();
    const vestingPeriodStart = vestingFields.get(3).as_integer();
    const vestingPeriodEnd = vestingFields.get(4).as_integer();
    const vestingUnlock = vestingFields.get(5).as_integer();
    const totalInstallments = vestingFields.get(6).as_integer();
    const memo = vestingFields.get(7).as_bytes();

    if (
      !beneficiary ||
      !vestingAsset ||
      !vestingQty ||
      !vestingPeriodStart ||
      !vestingPeriodEnd ||
      !vestingUnlock ||
      !totalInstallments ||
      !memo
    ) {
      throw new Error("[VestingDatum] Some of the fields were not set");
    }

    return new VestingDatum(
      beneficiary,
      vestingAsset,
      vestingQty,
      vestingPeriodStart,
      vestingPeriodEnd,
      vestingUnlock,
      totalInstallments,
      memo
    );
  }
}
