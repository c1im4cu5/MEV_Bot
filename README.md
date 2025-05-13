# 🧠 MEV Bot for Ethereum and Polygon

This project is a fully featured MEV (Maximal Extractable Value) trading bot designed for the **Ethereum** and **Polygon** blockchains. The bot scans decentralized exchanges for arbitrage and high-potential opportunities, executing trades programmatically through smart contract interactions.

## 🔧 Features

- Supports **Uniswap** and its forked DEXs across **v2**, **v3**, and **v4** protocols.
- Integrates with **GeckoTerminal** to identify trending and new pools.
- Executes trades through a **Vyper smart contract** deployed on-chain.
- Compatible with **L2 tokens** across Ethereum and Polygon.

---

## 📂 Project Structure

- `EthMevBot.js` or `PolygonMevBot.js` – Main logic for scanning pools and executing trades.
- `GeckoTerminalExtract.js` – Functions to fetch trending and new pool data from GeckoTerminal.
- `MEV.vy` – Vyper contract for executing trades on-chain.

---

## 📜 Smart Contract (Vyper)

The Vyper contract must be:

1. **Deployed** to the target blockchain (Ethereum/Polygon).
2. **Funded** with the desired L2 token.
3. **Authorized** to spend user wallet funds.

> **Note:**  
> This authorization is **not automatic** — it must be manually executed via the ERC-20 `approve()` function from your wallet to the contract address.

---

## ⚙️ Configuration

Update the following lines in your `EthMevBot.js` or `PolygonMevBot.js` (lines 23–25):

```js
const mevBotAddress = '<DEPLOYED MEV BOT ADDRESS ON BLOCKCHAIN>';
const web3 = new Web3('<YOUR WEB3 URL>');
const signature = '<PRIVATE KEY OF ADDRESS THAT DEPLOYED MEV BOT ON BLOCKCHAIN>';
```

The const list named "addressMap" in the CheckandTrade (roughly line 1620) function is the list of tokens to check for potential trades. You will want to alter the list to fit your needs:


```js
  const addressMap = ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'];
```

## 📌 Status & Notes

This application was being prepared for deployment with eVow, but the process is currently on hold. Minor adjustments may still be required to ensure full functionality.

Lastly, please note that the MEV Bot is designed to trade Layer 2 (L2) tokens. Depositing funds will require an approval mechanism for the MEV Bot's address to spend tokens via Web3. This approval method has already been configured on the eVow testnet environment.

## 📬 Contact

For questions or collaboration inquiries, reach out to:

**[Climacus](mailto:thebrotherscain@gmail.com)**
