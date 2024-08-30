import {
  BigNum,
  BigInt,
  ConstrPlutusData,
  PlutusData,
  Address,
  PlutusList,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { address_from_plutus_data, address_to_plutus_data } from "./addressUtils";
import { AssetClass } from "./AssetClass";
import { plutus_data_from_hex, plutus_list_from_list } from "./util";
import {
  AddLiquidityAction,
  RemoveLiquidityAction,
  RequestAction,
  RequestParseOptions,
  SwapAction,
} from "./RequestCommon";

export enum DatumType {
  No = 0,
  Hash = 1,
  Inline = 2,
}

export class RequestDatumV2 {
  constructor(
    public oil: BigInt,
    public beneficiary: Address,
    public ownerAddress: Address,
    public compensationDatum: PlutusData,
    public compensationDatumType: DatumType,
    public deadline: BigInt,
    public assetA: AssetClass,
    public assetB: AssetClass,
    public action: RequestAction,
    public aScale: BigInt,
    public bScale: BigInt
  ) {}

  static from_hex(hexString: string, opts: RequestParseOptions): RequestDatumV2 {
    const pData = plutus_data_from_hex(hexString);
    return RequestDatumV2.from_plutus_data(pData, opts);
  }

  static from_plutus_data(pData: PlutusData, opts: RequestParseOptions): RequestDatumV2 {
    const requestDatumFields = pData.as_constr_plutus_data()?.data();

    if (!requestDatumFields) {
      throw new Error("[RequestMetadata] Invalid Request datum fields");
    }

    const oil = requestDatumFields?.get(0).as_integer();
    if (!oil) {
      throw new Error("[LiquidityPoolDatum] Invalid oil");
    }

    const beneficiary = address_from_plutus_data(opts.networkId, requestDatumFields?.get(1));
    if (!beneficiary) {
      throw new Error("[LiquidityPoolDatum] Invalid beneficiary");
    }

    const ownerAddress = address_from_plutus_data(opts.networkId, requestDatumFields?.get(2));
    if (!ownerAddress) {
      throw new Error("[LiquidityPoolDatum] Invalid ownerAddress");
    }

    const compensationDatum = requestDatumFields?.get(3);
    if (!compensationDatum) {
      throw new Error("[LiquidityPoolDatum] Invalid compensationDatum");
    }

    const compensationDatumType = requestDatumFields?.get(4).as_constr_plutus_data();
    if (!compensationDatumType) {
      throw new Error("[LiquidityPoolDatum] Invalid compensationDatumType");
    }
    const datumType = (() => {
      switch (compensationDatumType.alternative().to_str()) {
        case "0":
          return DatumType.No;
        case "1":
          return DatumType.Hash;
        case "2":
          return DatumType.Inline;
        default:
          throw new Error("[Request] unknown datum type");
      }
    })();

    const deadline = requestDatumFields?.get(5).as_integer();
    if (!deadline) {
      throw new Error("[LiquidityPoolDatum] Invalid deadline");
    }

    const assetASymbol = requestDatumFields?.get(6).as_bytes();
    if (!assetASymbol) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetA CurrencySymbol");
    }
    const assetAToken = requestDatumFields?.get(7).as_bytes();
    if (!assetAToken) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetA TokenName");
    }
    const assetA = new AssetClass(assetASymbol, assetAToken);

    const assetBSymbol = requestDatumFields?.get(8).as_bytes();
    if (!assetBSymbol) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetB CurrencySymbol");
    }

    const assetBToken = requestDatumFields?.get(9).as_bytes();
    if (!assetBToken) {
      throw new Error("[LiquidityPoolDatum] Invalid AssetB TokenName");
    }
    const assetB = new AssetClass(assetBSymbol, assetBToken);

    const pAction = requestDatumFields?.get(10).as_constr_plutus_data();
    if (!pAction) {
      throw new Error("[Request] invalid action field");
    }
    const action = (() => {
      switch (pAction.alternative().to_str()) {
        case "0":
          return SwapAction.from_plutus_data(pAction);
        case "1":
          return AddLiquidityAction.from_plutus_data(pAction);
        case "2":
          return RemoveLiquidityAction.from_plutus_data(pAction);
        default:
          throw new Error("[Request] not implemented");
      }
    })();

    const scaleA = requestDatumFields?.get(11).as_integer();
    const scaleB = requestDatumFields?.get(12).as_integer();
    if (!scaleA || !scaleB) {
      throw new Error("[LiquidityPoolDatum] Invalid scales");
    }

    return new RequestDatumV2(
      oil,
      beneficiary,
      ownerAddress,
      compensationDatum,
      datumType,
      deadline,
      assetA,
      assetB,
      action,
      scaleA,
      scaleB
    );
  }

  to_plutus_data(): PlutusData {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("0"),
        plutus_list_from_list([
          PlutusData.new_integer(this.oil),
          address_to_plutus_data(this.beneficiary),
          address_to_plutus_data(this.ownerAddress),
          this.compensationDatum,
          PlutusData.new_constr_plutus_data(
            ConstrPlutusData.new(BigNum.from_str(this.compensationDatumType.toString(10)), PlutusList.new())
          ),
          PlutusData.new_integer(this.deadline),
          PlutusData.new_bytes(this.assetA.policyIdBuffer),
          PlutusData.new_bytes(this.assetA.assetNameBuffer),
          PlutusData.new_bytes(this.assetB.policyIdBuffer),
          PlutusData.new_bytes(this.assetB.assetNameBuffer),
          this.action.to_plutus_data(),
          PlutusData.new_integer(this.aScale),
          PlutusData.new_integer(this.bScale),
        ])
      )
    );
  }
}
