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
