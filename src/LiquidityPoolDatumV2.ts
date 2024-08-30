import { BigNum, BigInt, PlutusData, ScriptHash, Value } from "@dcspark/cardano-multiplatform-lib-browser";
import { AssetClass } from "./AssetClass";
import { plutus_data_from_hex, value_add_assetclass } from "./util";

export class LiquidityPoolDatumV2 {
  constructor(
    public requestValidatorHash: ScriptHash,
    public assetA: AssetClass,
    public assetB: AssetClass,
    public swapFeeInBasis: BigInt,
    public protocolFeeInBasis: BigInt,
    public projectFeeInBasis: BigInt,
    public feeBasis: BigInt,
    public agentFeeAda: BigInt,
    public lastInteraction: BigInt,
    public treasury: Value,
    public projectTreasury: Value
  ) {}

  static from_hex(hexString: string): LiquidityPoolDatumV2 {
    return LiquidityPoolDatumV2.from_plutus_data(plutus_data_from_hex(hexString));
  }

  static from_plutus_data(pData: PlutusData) {
    const lpDatumFields = pData.as_constr_plutus_data()?.data();

    const hash = lpDatumFields?.get(0).as_bytes();
    if (!hash) {
      throw new Error("[LiquidityPoolDatum] Invalid request validator hash");
    }
    const requestValidatorHash = ScriptHash.from_bytes(hash);

    const assetASymbol = lpDatumFields?.get(1).as_bytes();
    if (!assetASymbol) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetA CurrencySymbol");
    }
    const assetAToken = lpDatumFields?.get(2).as_bytes();
    if (!assetAToken) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetA TokenName");
    }
    const assetA = new AssetClass(assetASymbol, assetAToken);

    const assetBSymbol = lpDatumFields?.get(3).as_bytes();
    if (!assetBSymbol) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetB CurrencySymbol");
    }
    const assetBToken = lpDatumFields?.get(4).as_bytes();
    if (!assetBToken) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetB TokenName");
    }
    const assetB = new AssetClass(assetBSymbol, assetBToken);

    const swapFeeInBasis = lpDatumFields?.get(5).as_integer();
    const protocolFeeInBasis = lpDatumFields?.get(6).as_integer();
    const projectFeeInBasis = lpDatumFields?.get(7).as_integer();

    if (!swapFeeInBasis || !protocolFeeInBasis || !projectFeeInBasis) {
      throw new Error("[LiquidityPoolDatum] Invalid feeInbasis fields");
    }

    const feeBasis = lpDatumFields?.get(9).as_integer();
    if (!feeBasis) {
      throw new Error("[LiquidityPoolDatum] Invalid feeBasis");
    }

    const agentFeeAda = lpDatumFields?.get(10).as_integer();
    if (!agentFeeAda) {
      throw new Error("[LiquidityPoolDatum] Invalid agentFeeAda");
    }

    const lastInteraction = lpDatumFields?.get(11).as_integer();
    if (!lastInteraction) {
      throw new Error("[LiquidityPoolDatum] Invalid lastInteraction");
    }

    const treasuryA = lpDatumFields?.get(12).as_integer()?.as_u64();
    const treasuryB = lpDatumFields?.get(13).as_integer()?.as_u64();
    if (!treasuryA || !treasuryB) {
      throw new Error("[LiquidityPoolDatum] Invalid treasury fields");
    }

    const projectTreasuryA = lpDatumFields?.get(14).as_integer()?.as_u64();
    const projectTreasuryB = lpDatumFields?.get(15).as_integer()?.as_u64();
    if (!projectTreasuryA || !projectTreasuryB) {
      throw new Error("[LiquidityPoolDatum] Invalid project treasury fields");
    }

    let treasury = Value.new(BigNum.zero());
    treasury = value_add_assetclass(treasury, assetA, treasuryA);
    treasury = value_add_assetclass(treasury, assetB, treasuryB);

    let projectTreasury = Value.new(BigNum.zero());
    projectTreasury = value_add_assetclass(projectTreasury, assetA, projectTreasuryA);
    projectTreasury = value_add_assetclass(projectTreasury, assetB, projectTreasuryB);

    return new LiquidityPoolDatumV2(
      requestValidatorHash,
      assetA,
      assetB,
      swapFeeInBasis,
      protocolFeeInBasis,
      projectFeeInBasis,
      feeBasis,
      agentFeeAda,
      lastInteraction,
      treasury,
      projectTreasury
    );
  }
}
