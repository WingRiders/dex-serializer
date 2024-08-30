import {
  BigNum,
  BigInt,
  ConstrPlutusData,
  PlutusData,
  PlutusList,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { plutus_list_from_list } from "./util";

export type RequestParseOptions = {
  networkId: number;
};

export enum SwapDirection {
  ATOB = 0,
  BTOA = 1,
}

export interface RequestAction {
  to_plutus_data(): PlutusData;
}

export class RemoveLiquidityAction implements RequestAction {
  constructor(public minWantedA: BigInt, public minWantedB: BigInt) {}

  static from_plutus_data(data: ConstrPlutusData): RequestAction {
    if (data.alternative().to_str() !== "2") {
      throw new Error("[RemoveLiquidityAction] invalid action type");
    }
    const fields = data.data();
    const minWantedA = fields.get(0).as_integer();
    const minWantedB = fields.get(1).as_integer();
    if (!minWantedA || !minWantedB) {
      throw new Error("[RemoveLiquidityAction] invalid fields");
    }
    return new RemoveLiquidityAction(minWantedA, minWantedB);
  }

  to_plutus_data(): PlutusData {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("2"),
        plutus_list_from_list([
          PlutusData.new_integer(this.minWantedA),
          PlutusData.new_integer(this.minWantedB),
        ])
      )
    );
  }
}

export class SwapAction implements RequestAction {
  constructor(public direction: SwapDirection, public minWanted: BigInt) {}

  static from_plutus_data(data: ConstrPlutusData): RequestAction {
    if (data.alternative().to_str() !== "0") {
      throw new Error("[SwapAction] invalid action type");
    }
    const fields = data.data();
    const direction = fields.get(0).as_constr_plutus_data()?.alternative().to_str();
    const minWanted = fields.get(1).as_integer();
    if (!minWanted || !direction) {
      throw new Error("[SwapAction] invalid fields");
    }
    return new SwapAction(direction === "0" ? SwapDirection.ATOB : SwapDirection.BTOA, minWanted);
  }

  to_plutus_data(): PlutusData {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("0"),
        plutus_list_from_list([
          PlutusData.new_constr_plutus_data(
            ConstrPlutusData.new(BigNum.from_str(this.direction.toString(10)), PlutusList.new())
          ),
          PlutusData.new_integer(this.minWanted),
        ])
      )
    );
  }
}

export class AddLiquidityAction implements RequestAction {
  constructor(public minWanted: BigInt) {}

  static from_plutus_data(data: ConstrPlutusData): RequestAction {
    if (data.alternative().to_str() !== "1") {
      throw new Error("[AddLiquidityAction] invalid action type");
    }
    const fields = data.data();
    const minWanted = fields.get(0).as_integer();
    if (!minWanted) {
      throw new Error("[AddLiquidityAction] invalid fields");
    }
    return new AddLiquidityAction(minWanted);
  }

  to_plutus_data(): PlutusData {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("1"),
        plutus_list_from_list([PlutusData.new_integer(this.minWanted)])
      )
    );
  }
}
