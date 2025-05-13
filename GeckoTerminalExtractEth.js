const axios = require('axios');
const fetch = require('node-fetch');

async function fetchNewPools(page = 1) {
  const url = `https://api.geckoterminal.com/api/v2/networks/eth/pools`;
  try {
    const response = await axios.get(url, {
      params: {
        page: page,
        include: 'base_token,quote_token,dex'
      },
    });

    const pools = response.data.data;
    return pools.map(pool => {
      const baseTokenId = pool.relationships.base_token.data.id.replace('eth_', '');
      const quoteTokenId = pool.relationships.quote_token.data.id.replace('eth_', '');
      const dexId = pool.relationships.dex.data.id;

      return [baseTokenId, quoteTokenId, dexId, false, false, 500]; // Default fee of 500 if unknown
    });

  } catch (error) {
    console.error('Error fetching new pools:', error.message);
    return [];
  }
}

// Fetch multiple pages of new pools
async function fetchAllNewPools(maxPages = 10) {
  let allData = [];
  for (let page = 1; page <= maxPages; page++) {
    console.log(`Fetching page ${page}...`);
    const pageData = await fetchNewPools(page);
    allData = allData.concat(pageData);
    if (pageData.length === 0) {
      break; // Stop if no more data
    }
  }
  return { data: allData };
}

async function fetchTrendingPools(page = 1) {
  const url = `https://api.geckoterminal.com/api/v2/networks/eth/trending_pools`;
  try {
    const response = await axios.get(url, {
      params: {
        page: page,
        include: 'base_token,quote_token,dex',
      },
    });

    const pools = response.data.data;
    const result = pools.map(pool => {

    const poolName = pool.attributes.name;
    const feeMatch = poolName.match(/(\d+(\.\d+)?)%/);

    let hook = '';
    let tickSpacing = 0;

    // Initialize fee to 0 if no match is found
    let fee = 500;

    // If feeMatch exists, calculate the fee
    if (feeMatch) {
      const feePercentage = parseFloat(feeMatch[1]);
      fee = Math.floor(feePercentage * 1e4); // unit24 expects percentage * 10^4

      // Ensure fee is not negative
      if (fee < 0) {
        fee = 500;
      }
    }

    const baseTokenId = pool.relationships.base_token.data.id.replace('eth_', '');
    const quoteTokenId = pool.relationships.quote_token.data.id.replace('eth_', '');
    const dexId = pool.relationships.dex.data.id;


    const poolAddress = pool.attributes.address
    return [baseTokenId, quoteTokenId, dexId, false, false, fee, poolAddress, hook, tickSpacing];
    });

    return result;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return [];
  }
}

// Fetch multiple pages of data
async function fetchAllTrendingPools(maxPages = 11) {
  let allData = [];
  for (let page = 1; page <= maxPages; page++) {
    console.log(`Fetching page ${page}...`);
    const pageData = await fetchTrendingPools(page);
    allData = allData.concat(pageData);
    if (pageData.length === 0) {
      break; // Exit if no more data
    }
  }
  return { data: allData };
}

// Function to update boolean based on addressMap
function updatePoolDataWithAddressMap(poolData, addressMap) {
  const lowerCaseAddressMap = addressMap.map(address => address.toLowerCase());
  return poolData.map(sublist => {
      if (lowerCaseAddressMap.includes(sublist[0]) || lowerCaseAddressMap.includes(sublist[1])) {
          sublist[3] = true;  // Set the boolean value to true if a match is found
      }
      return sublist;
  });
}

// Function to find triangular trades based on addressMap
function findTriangularTrades(poolData, addressMap) {
    const lowerCaseAddressMap = addressMap.map(address => address.toLowerCase());
    const triangularTrades = [];  // Store the result

    // Helper function to find pools that include a specific token
    function findPoolsWithToken(token, excludePool = null) {
        return poolData.filter(sublist => {
            const sublist0 = sublist[0].toLowerCase();
            const sublist1 = sublist[1].toLowerCase();
            return (token === sublist0 || token === sublist1) && sublist !== excludePool;
        });
    }

    // Loop through each pool and find triangular trades
    poolData.forEach(sublist => {
        const sublist0 = sublist[0].toLowerCase();
        const sublist1 = sublist[1].toLowerCase();
        const dex1 = sublist[2]; // Assuming sublist[2] is the DEX name
        const fee1 = sublist[5]; // Assuming sublist[2] is the DEX name

        // Check if sublist[0] or sublist[1] is in addressMap
        if (lowerCaseAddressMap.includes(sublist0) || lowerCaseAddressMap.includes(sublist1)) {
            const originalToken = lowerCaseAddressMap.includes(sublist0) ? sublist0 : sublist1;
            const otherToken1 = lowerCaseAddressMap.includes(sublist0) ? sublist1 : sublist0;

            // Find pools that include otherToken1, but avoid the current pool (sublist)
            const poolsWithOtherToken1 = findPoolsWithToken(otherToken1, sublist);

            poolsWithOtherToken1.forEach(pool2 => {
                const pool2_0 = pool2[0].toLowerCase();
                const pool2_1 = pool2[1].toLowerCase();
                const dex2 = pool2[2]; // Assuming pool[2] is the DEX name
                const fee2 = pool2[5]

                const otherToken2 = (pool2_0 === otherToken1) ? pool2_1 : pool2_0;

                // Ensure otherToken2 is distinct from originalToken
                if (otherToken2 !== originalToken) {
                    // Find pools that include otherToken2, but avoid sublist and pool2
                    const poolsWithOtherToken2 = findPoolsWithToken(otherToken2, pool2);

                    poolsWithOtherToken2.forEach(pool3 => {
                        const pool3_0 = pool3[0].toLowerCase();
                        const pool3_1 = pool3[1].toLowerCase();
                        const dex3 = pool3[2]; // Assuming pool[2] is the DEX name
                        const fee3 = pool3[5];

                        // Check if the third pool contains the original token
                        if (pool3_0 === originalToken || pool3_1 === originalToken) {
                            // Triangular trade found
                            triangularTrades.push({
                                tokens: [originalToken, otherToken1, otherToken2],
                                dexes: [dex1, dex2, dex3],
                                fees: [fee1, fee2, fee3]
                            });
                        }
                    });
                }
            });
        }
    });

    return triangularTrades;
}

function generateCorrectSwapPaths(poolData, addressMap) {
    const lowerCaseAddressMap = addressMap.map(token => token.toLowerCase());
    const swapPaths = { 2: [], 3: [], 4: [], 5: [], 6: [] };

    function findPoolsWithToken(token, excludePool = null) {
        return poolData.filter(sublist => {
            const [tokenA, tokenB] = [sublist[0].toLowerCase(), sublist[1].toLowerCase()];
            return (tokenA === token || tokenB === token) && sublist !== excludePool;
        });
    }

    function exploreSwapPath(currentToken, pathDict, visitedTokens, depth) {
        if (depth > 6) return;

        const pools = findPoolsWithToken(currentToken, pathDict.lastUsedPool);
        pools.forEach(pool => {
            const [tokenA, tokenB, dex, , , fee] = pool.map(item => String(item).toLowerCase());
            const nextToken = (tokenA === currentToken) ? tokenB : tokenA;

            if (visitedTokens.has(nextToken) && nextToken !== pathDict.tokens[0]) return;

            const newPathDict = {
                tokens: [...pathDict.tokens, nextToken],
                dexes: [...pathDict.dexes, dex],
                fees: [...pathDict.fees, fee],
                lastUsedPool: pool
            };

            if (depth >= 2 && nextToken === pathDict.tokens[0]) {
                swapPaths[depth].push({
                    tokens: [pathDict.tokens[0], ...newPathDict.tokens.slice(1, -1), pathDict.tokens[0]],
                    dexes: newPathDict.dexes,
                    fees: newPathDict.fees
                });
            } else {
                exploreSwapPath(nextToken, newPathDict, new Set(visitedTokens).add(nextToken), depth + 1);
            }
        });
    }

    lowerCaseAddressMap.forEach(initialToken => {
        const initialPathDict = {
            tokens: [initialToken],
            dexes: [],
            fees: [],
            lastUsedPool: null
        };
        exploreSwapPath(initialToken, initialPathDict, new Set([initialToken]), 1);
    });

    return swapPaths;
}

// Function to generate swap paths with a max depth of six
function generateSwapPaths(poolData, addressMap) {
    const lowerCaseAddressMap = addressMap.map(token => token.toLowerCase());
    const swapPaths = { 2: [], 3: [], 4: [], 5: [], 6: [] }; // Store paths for each depth

    // Helper to find pools containing a specific token
    function findPoolsWithToken(token) {
        return poolData.filter(sublist => {
            const [tokenA, tokenB] = [sublist[0].toLowerCase(), sublist[1].toLowerCase()];
            return (tokenA === token || tokenB === token);
        });
    }

    // Recursive function to explore swap paths up to a given depth
    function exploreSwapPath(currentToken, currentPath, depth, initialToken, dexes, fees) {
        if (depth > 6) return; // Stop if the depth exceeds 6 swaps

        const pools = findPoolsWithToken(currentToken);

        pools.forEach(pool => {
            const [tokenA, tokenB, dex, , , fee] = pool.map(item => String(item).toLowerCase());
            const nextToken = (tokenA === currentToken) ? tokenB : tokenA;

            // Ensure the next token is not the same as any token in the current path except the initial token
            if (nextToken !== initialToken && !currentPath.includes(nextToken)) {
                // Create a new path
                const newPath = [...currentPath, nextToken];
                const newDexes = [...dexes, dex];
                const newFees = [...fees, fee];

                // Check if the path returns to the initial token and store it if valid
                if (nextToken === initialToken && depth >= 2) {
                    swapPaths[depth].push({
                        tokens: [initialToken, ...newPath], // Include the original token
                        dexes: newDexes,
                        fees: newFees,
                    });
                }

                // Continue exploring deeper paths
                exploreSwapPath(nextToken, newPath, depth + 1, initialToken, newDexes, newFees);
            }
        });
    }

    // Start the exploration for each token in the addressMap
    lowerCaseAddressMap.forEach(initialToken => {
        exploreSwapPath(initialToken, [initialToken], 1, initialToken, [], []);
    });

    return swapPaths;
}

// Function to extract unique DEXes from triangular trades
function getUniqueDexes(triangularTrades) {
    const uniqueDexesSet = new Set();  // Use a Set to ensure uniqueness

    triangularTrades.forEach(trade => {
        trade.dexes.forEach(dex => {
            uniqueDexesSet.add(dex);  // Add each DEX to the Set
        });
    });

    return Array.from(uniqueDexesSet);  // Convert the Set back to an array
}


async function fetchPrices() {
  const endpoints = [
    'https://api.geckoterminal.com/api/v2/networks/eth/tokens/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    'https://api.geckoterminal.com/api/v2/networks/eth/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  ];

  try {
    const [wbtcRes, wethRes] = await Promise.all(endpoints.map(url => fetch(url)));
    const [wbtcData, wethData] = await Promise.all([wbtcRes.json(), wethRes.json()]);

    const wbtcPrice = parseFloat(wbtcData.data.attributes.price_usd);
    const wethPrice = parseFloat(wethData.data.attributes.price_usd);

    return [ wbtcPrice, wethPrice ];
  } catch (err) {
    console.error("Error fetching token prices:", err.message);
    return [];
  }
}

// Exporting all functions
module.exports = {
  fetchNewPools,
  fetchAllNewPools,
  fetchTrendingPools,
  fetchAllTrendingPools,
  fetchPrices,
  updatePoolDataWithAddressMap,
  findTriangularTrades,
  getUniqueDexes,
  generateSwapPaths,
  generateCorrectSwapPaths
};
