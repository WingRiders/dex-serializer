import {
  BigNum,
  BigInt,
  ConstrPlutusData,
  PlutusData,
  PlutusList,
  ScriptHash,
  Value,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { AssetClass } from "./AssetClass";
import { plutus_data_from_hex, value_add_assetclass, value_get_assetclass } from "./util";

export class LiquidityPool {
  static from_plutus_data(pData: PlutusData) {
    const lpAssets = pData.as_constr_plutus_data()?.data();

    const assetA = AssetClass.from_plutus_data(lpAssets?.get(0));
    const assetB = AssetClass.from_plutus_data(lpAssets?.get(1));
    return { assetA, assetB };
  }

  /**
   * Warning! assetA and assetB need to be in lexological order
   */
  static to_plutus(assetA: AssetClass, assetB: AssetClass) {
    const assetsFields = PlutusList.new();
    assetsFields.add(assetA.to_plutus_data());
    assetsFields.add(assetB.to_plutus_data());
    return PlutusData.new_constr_plutus_data(ConstrPlutusData.new(BigNum.from_str("0"), assetsFields));
  }
}

export class LiquidityPoolDatumV1 {
  constructor(
    public requestScriptHash: ScriptHash,
    public assetA: AssetClass,
    public assetB: AssetClass,
    public treasury: Value,
    public lastInteracted: BigInt
  ) {}

  static from_hex(hexString: string): LiquidityPoolDatumV1 {
    return LiquidityPoolDatumV1.from_plutus_data(plutus_data_from_hex(hexString));
  }

  static from_plutus_data(pData: PlutusData) {
    const lpDatumFields = pData.as_constr_plutus_data()?.data();

    const maybeHash = lpDatumFields?.get(0).as_bytes();
    if (!maybeHash) {
      throw new Error("[LiquidityPoolDatum] Invalid request hash");
    }
    const requestScriptHash = ScriptHash.from_bytes(maybeHash);

    const lpState = lpDatumFields?.get(1).as_constr_plutus_data()?.data();
    const lpDatum = lpState?.get(0);
    if (!lpState || !lpDatum) {
      throw new Error("[LiquidityPoolDatum] No liquidity pool field");
    }
    const { assetA, assetB } = LiquidityPool.from_plutus_data(lpDatum);

    const lastInteracted = lpState?.get(1)?.as_integer();

    const treasuryA = lpState?.get(2).as_integer()?.as_u64();
    const treasuryB = lpState?.get(3).as_integer()?.as_u64();

    if (!treasuryA || !treasuryB || !lastInteracted) {
      throw new Error("[LiquidityPoolDatum] Invalid datum fields");
    }

    let treasury = Value.new(BigNum.zero());
    treasury = value_add_assetclass(treasury, assetA, treasuryA);
    treasury = value_add_assetclass(treasury, assetB, treasuryB);

    return new LiquidityPoolDatumV1(requestScriptHash, assetA, assetB, treasury, lastInteracted);
  }

  to_plutus_data(): PlutusData {
    const lpStateFields = PlutusList.new();
    lpStateFields.add(LiquidityPool.to_plutus(this.assetA, this.assetB));
    lpStateFields.add(PlutusData.new_integer(this.lastInteracted));

    const qtyTeasuryA = value_get_assetclass(this.treasury, this.assetA) || BigNum.zero();
    const qtyTeasuryB = value_get_assetclass(this.treasury, this.assetB) || BigNum.zero();
    lpStateFields.add(PlutusData.new_integer(BigInt.from_bytes(qtyTeasuryA.to_bytes())));
    lpStateFields.add(PlutusData.new_integer(BigInt.from_bytes(qtyTeasuryB.to_bytes())));
    const lpState = PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(BigNum.from_str("0"), lpStateFields)
    );

    const lpFields = PlutusList.new();
    lpFields.add(PlutusData.new_bytes(this.requestScriptHash.to_bytes()));
    lpFields.add(lpState);

    return PlutusData.new_constr_plutus_data(ConstrPlutusData.new(BigNum.from_str("0"), lpFields));
  }
}
