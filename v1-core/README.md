# NFTlend V1-Core

Protocol code for NFTlend.

## Local development

The following assumes the use of node `@>=14`.
### Install dependencies

```shell
npm install
```

### Compile

```shell
npx hardhat compile
```

### Test

```shell
npx hardhat test
```

### Deploy

Run local Harhdat node:
```shell
npx hardhat node --network hardhat
```

In a different shell window run the deploy script:
```shell
npx hardhat run --network localhost scripts/deployFork.js
```

## Licensing

The primary license for NFTlend V1 Core is the Business Source License 1.1 (`BUSL-1.1`), see [`LICENSE`](./LICENSE)