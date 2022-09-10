import { Address, BigInt, Ed25519KeyHash, StakeCredential } from "@dcspark/cardano-multiplatform-lib-browser";
import { AssetClass } from "../src/AssetClass";
import { RequestDatum, RequestMetadaDatum, SwapAction, SwapDirection } from "../src/RequestDatum";

const requestCbor =
  "d8799fd8799fd8799fd8799f581cdefbd3ccbfc23de364d7409df5b467f70ac39004020d8a8cec9b5d78ffd8799fd8799fd8799f581cf3300f150b42053474806855c22c47058d6a884332cff86ffd5f75b7ffffffff581cdefbd3ccbfc23de364d7409df5b467f70ac39004020d8a8cec9b5d781b0000018327f05d18d8799fd8799f4040ffd8799f581c8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f695874441414441ffffffd8799fd87a801a23c8cf8effff";

describe("request", () => {
  it("from cbor", () => {
    const request = RequestDatum.from_hex(requestCbor, { networkId: 1 });
    expect(request.metadata.beneficiary.to_bech32()).toBe(
      "addr1q800h57vhlprmcmy6aqfmad5vlms4susqspqmz5vajd4678nxq832z6zq568fqrg2hpzc3c9344gssejeluxll2lwkmsya902a"
    );
    expect(request.metadata.owner.to_keyhash()?.to_hex()).toBe(
      "defbd3ccbfc23de364d7409df5b467f70ac39004020d8a8cec9b5d78"
    );
    expect(request.metadata.lpAssetA.to_subject()).toBe("");
    expect(request.metadata.lpAssetB.to_subject()).toBe(
      "8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f6958741414441"
    );
    expect(request.metadata.deadline.to_str()).toBe("1662822407448");
    expect(request.action).toBeInstanceOf(SwapAction);
    const swapAction = request.action as SwapAction;
    expect(swapAction.direction).toBe(SwapDirection.BTOA);
    expect(swapAction.minWanted.to_str()).toBe("600362894");
  });

  it("to plutus cbor", () => {
    const metadata = new RequestMetadaDatum(
      Address.from_bech32(
        "addr1q800h57vhlprmcmy6aqfmad5vlms4susqspqmz5vajd4678nxq832z6zq568fqrg2hpzc3c9344gssejeluxll2lwkmsya902a"
      ),
      StakeCredential.from_keyhash(
        Ed25519KeyHash.from_hex("defbd3ccbfc23de364d7409df5b467f70ac39004020d8a8cec9b5d78")
      ),
      BigInt.from_str("1662822407448"),
      AssetClass.from_hex("", ""),
      AssetClass.from_hex("8FEF2D34078659493CE161A6C7FBA4B56AFEFA8535296A5743F69587", "41414441")
    );
    const swapAction = new SwapAction(SwapDirection.BTOA, BigInt.from_str("600362894"));
    const request = new RequestDatum(metadata, swapAction);

    expect(Buffer.from(request.to_plutus_data().to_bytes()).toString("hex")).toBe(requestCbor);
  });
});
