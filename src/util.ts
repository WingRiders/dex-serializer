import {
  BigNum,
  MultiAsset,
  PlutusData,
  PlutusList,
  Value,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { AssetClass } from "./AssetClass";

export function value_add_assetclass(value: Value, assetClass: AssetClass, amount: BigNum) {
  const policyId = assetClass.policyId();
  const assetName = assetClass.assetName();
  if (policyId && assetName) {
    const ma = MultiAsset.new();
    ma.set_asset(policyId, assetName, amount);
    return value.checked_add(Value.new_from_assets(ma));
  } else {
    // ada
    return value.checked_add(Value.new(amount));
  }
}

export function value_get_assetclass(value: Value, assetClass: AssetClass) {
  const policyId = assetClass.policyId();
  const assetName = assetClass.assetName();
  if (policyId && assetName) {
    return value.multiasset()?.get_asset(policyId, assetName) || BigNum.zero();
  } else {
    return value.coin();
  }
}

export function plutus_data_from_hex(hexString: string) {
  const uint8Array = Uint8Array.from(Buffer.from(hexString, "hex"));
  const pData = PlutusData.from_bytes(uint8Array);
  return pData;
}

export function plutus_list_from_list(fields: PlutusData[]) {
  const list = PlutusList.new();
  fields.forEach((data) => list.add(data));
  return list;
}
