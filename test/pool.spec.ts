import { BigNum, ScriptHash, Value, BigInt } from "@dcspark/cardano-multiplatform-lib-browser";
import { LiquidityPoolDatumV1 } from "../src/LiquidityPoolDatumV1";
import { value_add_assetclass } from "../src/util";
import { AssetClass } from "../src/AssetClass";

const poolCbor =
  "d8799f581c86ae9eebd8b97944a45201e4aec1330a72291af2d071644bba015959d8799fd8799fd8799f4040ffd8799f581c8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f695874441414441ffff1b00000183274b3dd01a2a6f08dd1a1b5ddfe0ffff";

describe("pool", () => {
  it("from cbor", () => {
    const lp = LiquidityPoolDatumV1.from_hex(poolCbor)!;
    expect(lp.requestScriptHash.to_hex()).toBe("86ae9eebd8b97944a45201e4aec1330a72291af2d071644bba015959");
    expect(lp.assetA.policyIdHex()).toBe("");
    expect(lp.assetA.assetNameHex()).toBe("");
    expect(lp.assetB.policyIdHex()).toBe("8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f69587");
    expect(lp.assetB.assetNameHex()).toBe("41414441");
    expect(lp.lastInteracted.to_str()).toBe("1662811586000");
    expect(lp.treasury.coin().to_str()).toBe("711919837");
    expect(lp.treasury.multiasset()?.get_asset(lp.assetB.policyId()!, lp.assetB.assetName()!).to_str()).toBe(
      "459136992"
    );
  });

  it("to cbor", () => {
    const assetB = AssetClass.from_hex(
      "8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f69587",
      "41414441"
    );
    const lp = new LiquidityPoolDatumV1(
      ScriptHash.from_hex("86ae9eebd8b97944a45201e4aec1330a72291af2d071644bba015959"),
      AssetClass.from_hex("", ""),
      assetB,
      value_add_assetclass(Value.new(BigNum.from_str("711919837")), assetB, BigNum.from_str("459136992")),
      BigInt.from_str("1662811586000")
    );
    expect(Buffer.from(lp.to_plutus_data().to_bytes()).toString("hex")).toBe(poolCbor);
  });
});
