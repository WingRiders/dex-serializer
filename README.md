# EXPERIMENTAL WingRiders serializer

Includes support for smart contract datum types for WingRiders.
Uses `@dcspark/cardano-multiplatform-lib` as a serializer and for support for cardano-specific datum types. (it's a drop-in replacemenet for `cardano-serialization-lib`)

## Installation

Please add to your `.npmrc`

```
@wingriders:registry=https://npm.pkg.github.com
```

Afterwards you will be able to install the package with:

```bash
npm install @wingriders/dex-serializer
```

## Usage

```typescript
import { LiquidityPoolDatum } from "@wingriders/dex-serializer";

const lpDatumHexString = await fetch(/* fetch the lp datum corresponding to an LP utxo */);
try {
  const lp = LiquidityPoolDatum.from_hex(lpDatumHex);

  // get the concatenated policyId and token name (subject) for the asset - can be looked up in explorers
  const assetBSubject = lp.assetB.to_subject();

  /* ... */
} catch (err) {
  // invalid lp datum
}
```

## Known issues

- serialization lib conflicting types between nodejs and browser versions (the es module is built for browers, the commonjs is built for nodejs)
- Orders: only swap is supported for now

## Development

```bash
npm install
npm run build
```
