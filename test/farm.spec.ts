import { FarmDatum } from "../src/FarmDatum";

const farmCbor =
  "d8799fd8799fd8799f581c04a6306580e07b93d8d860a769cd895eecb5d896b492e13c57c6102dffd8799fd8799fd8799f581cdaf59f8d09f00177712afb584418af7b93e94bc58be5706d42b5db53ffffffff4100d8799f581ca0748ce7f2e9a1848d75adf2be0c09c6b5a0e6c08d39a10f91adb43058202ad8dbb404bebddbd59bfea53a974ddd7b59470c94c7d45461983a6ac4bdf0d2ffff";

describe("farm", () => {
  it("from cbor", () => {
    const farm = FarmDatum.from_hex(farmCbor, { networkId: 0 })!;
    expect(farm.owner.to_bech32()).toBe(
      "addr_test1qqz2vvr9srs8hy7cmps2w6wd390wedwcj66f9cfu2lrpqtw67k0c6z0sq9mhz2hmtpzp3tmmj055h3vtu4cx6s44mdfs35tqtt"
    );
    expect(farm.preferredStakePool.toString("hex")).toBe("00");
    expect(farm.farmToken.to_subject()).toBe(
      "a0748ce7f2e9a1848d75adf2be0c09c6b5a0e6c08d39a10f91adb4302ad8dbb404bebddbd59bfea53a974ddd7b59470c94c7d45461983a6ac4bdf0d2"
    );
  });
});
