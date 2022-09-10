import {
  AssetName,
  BigNum,
  ConstrPlutusData,
  PlutusData,
  PlutusList,
  ScriptHash,
} from "@dcspark/cardano-multiplatform-lib-browser";

export class AssetClass {
  public readonly isAda: boolean;
  constructor(private policyIdBuffer: Uint8Array, private assetNameBuffer: Uint8Array) {
    this.isAda = policyIdBuffer.length === 0 && assetNameBuffer.length === 0;
  }

  public policyId(): ScriptHash | undefined {
    return !this.isAda ? ScriptHash.from_bytes(this.policyIdBuffer) : undefined;
  }

  public assetName(): AssetName | undefined {
    return !this.isAda ? AssetName.new(this.assetNameBuffer) : undefined;
  }

  public policyIdHex() {
    return this.policyId()?.to_hex() || "";
  }

  public assetNameHex() {
    return this.assetName()?.to_js_value() || "";
  }

  public to_subject(): string {
    return `${this.policyIdHex()}${this.assetNameHex()}`;
  }

  public to_plutus_data(): PlutusData {
    const fields = PlutusList.new();
    fields.add(PlutusData.new_bytes(this.policyIdBuffer));
    fields.add(PlutusData.new_bytes(this.assetNameBuffer));
    return PlutusData.new_constr_plutus_data(ConstrPlutusData.new(BigNum.from_str("0"), fields));
  }

  static from_plutus_data(data: PlutusData | undefined) {
    if (!data) {
      throw Error("[AssetClass] nothing to parse");
    }

    const fields = data?.as_constr_plutus_data()?.data();
    const policyId = fields?.get(0).as_bytes();
    const assetName = fields?.get(1).as_bytes();

    if (!policyId || !assetName) {
      throw new Error("[AssetClass] invalid fields");
    }

    return new AssetClass(policyId, assetName);
  }

  static from_hex(policyId: string, assetName: string) {
    return new AssetClass(
      Uint8Array.from(Buffer.from(policyId, "hex")),
      Uint8Array.from(Buffer.from(assetName, "hex"))
    );
  }
}
