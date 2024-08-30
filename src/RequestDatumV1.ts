import {
  BigNum,
  BigInt,
  ConstrPlutusData,
  PlutusData,
  Address,
  Ed25519KeyHash,
  StakeCredential,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { address_from_plutus_data, address_to_plutus_data } from "./addressUtils";
import { AssetClass } from "./AssetClass";
import { LiquidityPool } from "./LiquidityPoolDatumV1";
import { plutus_data_from_hex, plutus_list_from_list } from "./util";
import {
  AddLiquidityAction,
  RemoveLiquidityAction,
  RequestAction,
  RequestParseOptions,
  SwapAction,
} from "./RequestCommon";

export class RequestMetadaDatum {
  constructor(
    public beneficiary: Address,
    public owner: StakeCredential,
    public deadline: BigInt,
    public lpAssetA: AssetClass,
    public lpAssetB: AssetClass
  ) {}

  static from_plutus_data(pData: PlutusData, opts: RequestParseOptions) {
    if (pData.as_constr_plutus_data()?.alternative().to_str() !== "0") {
      throw new Error("[RequestMetadata] Invalid request metadata constructor");
    }
    const fields = pData.as_constr_plutus_data()?.data();

    if (!fields || fields.len() !== 4) {
      throw new Error("[RequestMetadata] Invalid number of fields");
    }

    const beneficiary = address_from_plutus_data(opts.networkId, fields.get(0));
    const owner = StakeCredential.from_keyhash(Ed25519KeyHash.from_bytes(fields.get(1).as_bytes()!));
    const deadline = fields.get(2).as_integer();
    const { assetA, assetB } = LiquidityPool.from_plutus_data(fields.get(3));

    if (!deadline) {
      throw new Error("[RequestMetadata] Invalid request metadata fields");
    }

    return new RequestMetadaDatum(beneficiary, owner, deadline, assetA, assetB);
  }

  to_plutus_data(): PlutusData {
    const pBeneficiary = address_to_plutus_data(this.beneficiary);
    const pOwner = PlutusData.new_bytes(this.owner.to_keyhash()!.to_bytes());
    const pLp = LiquidityPool.to_plutus(this.lpAssetA, this.lpAssetB);

    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("0"),
        plutus_list_from_list([pBeneficiary, pOwner, PlutusData.new_integer(this.deadline), pLp])
      )
    );
  }
}

export class RequestDatumV1 {
  constructor(public metadata: RequestMetadaDatum, public action: RequestAction) {}

  static from_hex(hexString: string, opts: RequestParseOptions): RequestDatumV1 {
    const pData = plutus_data_from_hex(hexString);
    return RequestDatumV1.from_plutus_data(pData, opts);
  }

  static from_plutus_data(pData: PlutusData, opts: RequestParseOptions): RequestDatumV1 {
    if (pData.as_constr_plutus_data()?.alternative().to_str() !== "0") {
      throw new Error("[Request] Invalid request metadata constructor");
    }
    const fields = pData.as_constr_plutus_data()?.data();
    if (!fields || fields.len() !== 2) {
      throw new Error("[Request] Invalid number of fields");
    }

    const pAction = fields.get(1).as_constr_plutus_data();
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

    return new RequestDatumV1(RequestMetadaDatum.from_plutus_data(fields.get(0), opts), action);
  }

  to_plutus_data(): PlutusData {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("0"),
        plutus_list_from_list([this.metadata.to_plutus_data(), this.action.to_plutus_data()])
      )
    );
  }
}
