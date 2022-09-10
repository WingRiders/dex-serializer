import { BigNum } from "@dcspark/cardano-multiplatform-lib-browser";
import { VestingDatum } from "../src/VestingDatum";

const vestingCbor =
  "d8799fd8799fd8799f581c414815f5feff1ce66a396b0b0b35f4cab871f2a79c42887038da1f6fffd8799fd8799fd8799f581c4d6e50e9573699f4222bdf5d6a9d4599a3821b0d9c07e2abcfdf1144ffffffffd8799f581cc0ee29a85b13209423b10447d3c2e6a50641a15c57770e27cb9d50734a57696e67526964657273ff1a32a9f8801b00000181fc26a5001b000001893a1805001b00000183312435000c4977686974656c697374ff";

describe("vesting", () => {
  it("from cbor", () => {
    const vesting = VestingDatum.from_hex(vestingCbor, { networkId: 0 })!;

    expect(vesting.beneficiary.payment_cred()?.to_keyhash()?.to_hex()).toBe(
      "414815f5feff1ce66a396b0b0b35f4cab871f2a79c42887038da1f6f"
    );
    expect(vesting.beneficiary.staking_cred()?.to_keyhash()?.to_hex()).toBe(
      "4d6e50e9573699f4222bdf5d6a9d4599a3821b0d9c07e2abcfdf1144"
    );
    expect(vesting.vestingAsset.policyIdHex()).toBe(
      "c0ee29a85b13209423b10447d3c2e6a50641a15c57770e27cb9d5073"
    );
    expect(vesting.vestingAsset.assetNameHex()).toBe("57696e67526964657273");
    expect(vesting.totalVestingQty.to_str()).toBe("850000000");
    expect(vesting.vestingPeriodStart.to_str()).toBe("1657792800000");
    expect(vesting.vestingPeriodEnd.to_str()).toBe("1688896800000");
    expect(vesting.vestingUnlock.to_str()).toBe("1662976800000");
    expect(vesting.totalInstallments.to_str()).toBe("12");
    expect(Buffer.from(vesting.vestingMemo).toString()).toBe("whitelist");
  });
});
