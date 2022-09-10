import { BigNum, ConstrPlutusData, PlutusData, PlutusList } from "@dcspark/cardano-multiplatform-lib-browser";
import { plutus_list_from_list } from "./util";

export class Maybe {
  static just(pData: PlutusData) {
    return PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(BigNum.from_str("0"), plutus_list_from_list([pData]))
    );
  }

  static nothing() {
    return PlutusData.new_constr_plutus_data(ConstrPlutusData.new(BigNum.from_str("1"), PlutusList.new()));
  }
}
