const { Web3 }  = require('web3');
const { toHex} = require('web3-utils');
const BigNumber = require('bignumber.js');
const { Interface } = require('@ethersproject/abi');
const IQuoter = require('./node_modules/@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const { ChainId, Token, Fetcher, Route, Trade, TokenAmount, TradeType } = require('@quickswap/sdk');

const customOrders = require('./orders.json');

const {
  fetchTrendingPools,
  fetchAllTrendingPools,
  fetchNewPools,
  fetchAllNewPools,
  fetchPrices,
  updatePoolDataWithAddressMap,
  findTriangularTrades,
  getUniqueDexes,
  generateSwapPaths,
  generateCorrectSwapPaths
} = require('./GeckoTerminalExtractEth');

const mevBotAddress = '<DEPLOYED MEV BOT ADDRESS ON BLOCKCHAIN>';
const web3 = new Web3('<YOUR WEB3 URL>');
const signature = '<PRIVATE KEY OF ADDRESS THAT DEPLOYED MEV BOT ON BLOCKCHAIN>';

//Router Addresses
const uniswapSwapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const uniswap2Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const sushiswapRouter = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
const s3Router = '0x2E6cd2d30aa43f40aa81619ff4b6E0a41479B13F';
const pancakeRouter = '0x1b81D678ffb9C0263b24A97847620C99d213eB14';
const dooarRouter = '0x53e0e51b5Ed9202110D7Ecd637A4581db8b9879F';
const uniswap4Router = '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af';
const maverickRouter = '0x62e31802c6145A2D5E842EeD8efe01fC224422fA';
//MAV Quoter = 0xb40AfdB85a07f37aE217E7D6462e609900dD8D7A

const mevABI = [{"stateMutability": "nonpayable", "type": "constructor", "inputs": [], "outputs": []}, {"stateMutability": "nonpayable", "type": "function", "name": "DepositToken", "inputs": [{"name": "_amount", "type": "uint256"}, {"name": "_token", "type": "address"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "changeV3Address", "inputs": [{"name": "_token", "type": "address"}, {"name": "_listSpace", "type": "uint24"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "payable", "type": "function", "name": "DepositNative", "inputs": [{"name": "_amount", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "recover", "inputs": [], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "recoverTokens", "inputs": [{"name": "tokenAddress", "type": "address"}, {"name": "_withdraw", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "TriDexSwap", "inputs": [{"name": "_route1", "type": "address"}, {"name": "_route2", "type": "address"}, {"name": "_route3", "type": "address"}, {"name": "_token1", "type": "address"}, {"name": "_token2", "type": "address"}, {"name": "_token3", "type": "address"}, {"name": "_amount", "type": "uint256"}, {"name": "_outMin1", "type": "uint256"}, {"name": "_outMin2", "type": "uint256"}, {"name": "_outMin3", "type": "uint256"}, {"name": "_fee1", "type": "uint24"}, {"name": "_fee2", "type": "uint24"}, {"name": "_fee3", "type": "uint24"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "view", "type": "function", "name": "v3", "inputs": [{"name": "arg0", "type": "uint256"}], "outputs": [{"name": "", "type": "address"}]}];

const mevBytecode = '3461008957335f555f600155732e6cd2d30aa43f40aa81619ff4b6e0a41479b13f60025573e592427a0aece92de3edee1f18e0157c05861564600355731b81d678ffb9c0263b24a97847620c99d213eb146004557366a9893cc07d91d95644aedd05d03f95e1dba8af6005555f6006555f6007555f6008556118aa61008d610000396118aa610000f35b5f80fd5f3560e01c60026009820660011b61189801601e395f51565b6304ab87478118610045576024361034176118945760043560068111611894576002015460405260206040f35b63ad8d6c5e811861179357604436103417611894576024358060a01c611894576040526040516370a082316080523360a052602060806024609c845afa61008e573d5f5f3e3d5ffd5b60203d10611894576080905051606052600435606051186100b05760016100b8565b600435606051115b61013c5760266080527f4e6f7420656e6f75676820746f6b656e20696e2077616c6c657420746f20707260a0527f6f636565642e000000000000000000000000000000000000000000000000000060c0526080506080518060a001601f825f031636823750506308c379a06040526020606052601f19601f6080510116604401605cfd5b6040516323b872dd60a0523360c0523060e05260043561010052602060a0606460bc5f855af161016e573d5f5f3e3d5ffd5b60203d106118945760a0518060011c61189457610120526101209050516080526080516101f157601960a0527f5472616e736665722077617320756e7375636365737366756c0000000000000060c05260a05060a0518060c001601f825f031636823750506308c379a06060526020608052601f19601f60a0510116604401607cfd5b600160a052602060a0f3611793565b639175d3d181186102b357604436103417611894576004358060a01c611894576040526024358060181c611894576060525f5433181561029657601d6080527f4f6e6c79206f776e65722063616e207265636f76657220746f6b656e7300000060a0526080506080518060a001601f825f031636823750506308c379a06040526020606052601f19601f6080510116604401605cfd5b604051606051600681116118945760020155600160805260206080f35b63ce1a1fb6811861179357602336111561189457600160405260206040f3611793565b63ce74602481186117935734611894575f5433181561034a57601d6040527f4f6e6c79206f776e65722063616e207265636f76657220746f6b656e7300000060605260405060405180606001601f825f031636823750506308c379a05f526020602052601f19601f6040510116604401601cfd5b5f5f5f5f47335ff11561189457600160405260206040f3611793565b63069c9fae811861179357604436103417611894576004358060a01c611894576040525f543318156104125760216060527f4f6e6c7920746865206f776e65722063616e207265636f76657220746f6b656e6080527f730000000000000000000000000000000000000000000000000000000000000060a05260605060605180608001601f825f031636823750506308c379a06020526020604052601f19601f6060510116604401603cfd5b6040516060526060516370a0823160a0523060c052602060a0602460bc845afa61043e573d5f5f3e3d5ffd5b60203d106118945760a090505160805260243560805111610466576024356080511815610469565b60015b6104c957601d60a0527f4e6f7420656e6f7567682066756e647320696e20636f6e74726163742e00000060c05260a05060a0518060c001601f825f031636823750506308c379a06060526020608052601f19601f60a0510116604401607cfd5b60605163a9059cbb60a0523360c05260243560e052602060a0604460bc5f855af16104f6573d5f5f3e3d5ffd5b60203d106118945760a0518060011c61189457610100526101005050600160a052602060a0f3611793565b63a5f79f548118611793576101a436103417611894576004358060a01c61189457610220526024358060a01c61189457610240526044358060a01c61189457610260526064358060a01c61189457610280526084358060a01c611894576102a05260a4358060a01c611894576102c052610144358060181c611894576102e052610164358060181c6118945761030052610184358060181c61189457610320525f54331815610654576025610340527f4f6e6c7920746865206f776e65722063616e2063616c6c20746869732066756e610360527f6374696f6e0000000000000000000000000000000000000000000000000000006103805261034050610340518061036001601f825f031636823750506308c379a061030052602061032052601f19601f61034051011660440161031cfd5b6102805163095ea7b361036052610220516103805260c4356103a0526020610360604461037c5f855af161068a573d5f5f3e3d5ffd5b60203d1061189457610360518060011c611894576103c0526103c09050516103405261034051610719576020610360527f546f6b656e206e6f7420617070726f76656420666f72207370656e64696e672e6103805261036050610360518061038001601f825f031636823750506308c379a061032052602061034052601f19601f61036051011660440161033cfd5b42601e8101818110611894579050610360526060366103803761028051610400526102a0516104205260026103e0526102a051610460526102c051610480526002610440526102c0516104c052610280516104e05260026104a052610220515f610500525f6007905b80600201548318610798576001610500526107a3565b600101818118610782575b505061050051905061089a57610220516338ed17396105205260a0604060c461054037806105805280610540015f6103e0518083528060051b5f826002811161189457801561080c57905b8060051b61040001518160051b6020880101526001018181186107ee575b50508201602001915050905081019050306105a052610360516105c0525061018061052061010461053c5f855af1610846573d5f5f3e3d5ffd5b60403d10611894576105205161052001600a81511161189457805160208160051b01806106c0828560045afa505050506106c09050600281511061189457600160051b602082010190505161038052610c82565b610220515f610500525f6007905b806002015483186108be576001610500526108c9565b6001018181186108a8575b505061050051905015610c825760025461022051186109825761028051610520526102a0516105405230610560526103605161058052604060c46105a0375f6105e0526102205163bc6511886106005261052051610620526105405161064052610560516106605261058051610680526105a0516106a0526105c0516106c0526105e0516106e052602061060060e461061c5f855af161096b573d5f5f3e3d5ffd5b60203d106118945761060090505161038052610c82565b6005546102205118610bd557610280516040526102e0516060526102a0516080526109ae6105a0611797565b6105a0602081510180610520828460045afa50505060016105e0527f0400000000000000000000000000000000000000000000000000000000000000610600526105e080516105a05260208101516105c0525060206105205101806106008261052060045afa505060c43562012600526201260080516201264052602062012620526201262090508051610720526020810151610740525060e4356201266052620126608051620126a052602062012680526201268090508051610840526020810151610860525030620126c052620126c0600c810180516201270052506014620126e052620126e090508051610960526020810151610980525060046105e05261022051633593564c620126005260608062012620528062012620016105a05181526105c05160208201528051806020830101601f825f03163682375050601f19601f825160200101169050810190508062012640528062012620015f6105e0518083528060051b5f826101008111611894578015610b8557905b828160051b60208801015261012081026106000183602088010160208251018082828560045afa50508051806020830101601f825f03163682375050601f19601f825160200101169050905083019250600101818118610b2a575b5050820160200191505090508101905061036051620126605250602062012600620140c46201261c5f855af1610bbd573d5f5f3e3d5ffd5b60203d10611894576201260090505161038052610c82565b61028051610520526102a051610540526102e051610560523061058052610360516105a052604060c46105c0375f610600526102205163414bf38961062052610520516106405261054051610660526105605161068052610580516106a0526105a0516106c0526105c0516106e0526105e051610700526106005161072052602061062061010461063c5f855af1610c6f573d5f5f3e3d5ffd5b60203d1061189457610620905051610380525b6102a05163095ea7b361050052610240516105205261038051610540526020610500604461051c5f855af1610cb9573d5f5f3e3d5ffd5b60203d1061189457610500518060011c61189457610560526105609050511561189457610240515f610500525f6007905b80600201548318610d0057600161050052610d0b565b600101818118610cea575b5050610500519050610e0a57610240516338ed17396105205260a061038051610540526101043561056052806105805280610540015f610440518083528060051b5f8260028111611894578015610d7c57905b8060051b61046001518160051b602088010152600101818118610d5e575b50508201602001915050905081019050306105a052610360516105c0525061018061052061010461053c5f855af1610db6573d5f5f3e3d5ffd5b60403d10611894576105205161052001600a81511161189457805160208160051b01806106c0828560045afa505050506106c09050600281511061189457600160051b60208201019050516103a052611204565b610240515f610500525f6007905b80600201548318610e2e57600161050052610e39565b600101818118610e18575b505061050051905015611204576002546102405118610efa576102a051610520526102c0516105405230610560526103605161058052610380516105a052610104356105c0525f6105e0526102405163bc6511886106005261052051610620526105405161064052610560516106605261058051610680526105a0516106a0526105c0516106c0526105e0516106e052602061060060e461061c5f855af1610ee3573d5f5f3e3d5ffd5b60203d10611894576106009050516103a052611204565b600554610240511861114f576102a051604052610300516060526102c051608052610f266105a0611797565b6105a0602081510180610520828460045afa50505060016105e0527f0400000000000000000000000000000000000000000000000000000000000000610600526105e080516105a05260208101516105c0525060206105205101806106008261052060045afa505061038051620126005262012600805162012640526020620126205262012620905080516107205260208101516107405250610104356201266052620126608051620126a052602062012680526201268090508051610840526020810151610860525030620126c052620126c0600c810180516201270052506014620126e052620126e090508051610960526020810151610980525060046105e05261024051633593564c620126005260608062012620528062012620016105a05181526105c05160208201528051806020830101601f825f03163682375050601f19601f825160200101169050810190508062012640528062012620015f6105e0518083528060051b5f8261010081116118945780156110ff57905b828160051b60208801015261012081026106000183602088010160208251018082828560045afa50508051806020830101601f825f03163682375050601f19601f8251602001011690509050830192506001018181186110a4575b5050820160200191505090508101905061036051620126605250602062012600620140c46201261c5f855af1611137573d5f5f3e3d5ffd5b60203d1061189457620126009050516103a052611204565b6102a051610520526102c0516105405261030051610560523061058052610360516105a052610380516105c052610104356105e0525f610600526102405163414bf38961062052610520516106405261054051610660526105605161068052610580516106a0526105a0516106c0526105c0516106e0526105e051610700526106005161072052602061062061010461063c5f855af16111f1573d5f5f3e3d5ffd5b60203d10611894576106209050516103a0525b6102c05163095ea7b36105005261026051610520526103a051610540526020610500604461051c5f855af161123b573d5f5f3e3d5ffd5b60203d1061189457610500518060011c61189457610560526105609050511561189457610260515f610500525f6007905b806002015483186112825760016105005261128d565b60010181811861126c575b505061050051905061138c57610260516338ed17396105205260a06103a051610540526101243561056052806105805280610540015f6104a0518083528060051b5f82600281116118945780156112fe57905b8060051b6104c001518160051b6020880101526001018181186112e0575b50508201602001915050905081019050306105a052610360516105c0525061018061052061010461053c5f855af1611338573d5f5f3e3d5ffd5b60403d10611894576105205161052001600a81511161189457805160208160051b01806106c0828560045afa505050506106c09050600281511061189457600160051b60208201019050516103c052611786565b610260515f610500525f6007905b806002015483186113b0576001610500526113bb565b60010181811861139a575b50506105005190501561178657600254610260511861147c576102c051610520526102805161054052306105605261036051610580526103a0516105a052610124356105c0525f6105e0526102605163bc6511886106005261052051610620526105405161064052610560516106605261058051610680526105a0516106a0526105c0516106c0526105e0516106e052602061060060e461061c5f855af1611465573d5f5f3e3d5ffd5b60203d10611894576106009050516103c052611786565b60055461026051186116d1576102c05160405261032051606052610280516080526114a86105a0611797565b6105a0602081510180610520828460045afa50505060016105e0527f0400000000000000000000000000000000000000000000000000000000000000610600526105e080516105a05260208101516105c0525060206105205101806106008261052060045afa50506103a051620126005262012600805162012640526020620126205262012620905080516107205260208101516107405250610124356201266052620126608051620126a052602062012680526201268090508051610840526020810151610860525030620126c052620126c0600c810180516201270052506014620126e052620126e090508051610960526020810151610980525060046105e05261024051633593564c620126005260608062012620528062012620016105a05181526105c05160208201528051806020830101601f825f03163682375050601f19601f825160200101169050810190508062012640528062012620015f6105e0518083528060051b5f82610100811161189457801561168157905b828160051b60208801015261012081026106000183602088010160208251018082828560045afa50508051806020830101601f825f03163682375050601f19601f825160200101169050905083019250600101818118611626575b5050820160200191505090508101905061036051620126605250602062012600620140c46201261c5f855af16116b9573d5f5f3e3d5ffd5b60203d1061189457620126009050516103c052611786565b6102c05161052052610280516105405261032051610560523061058052610360516105a0526103a0516105c052610124356105e0525f610600526102605163414bf38961062052610520516106405261054051610660526105605161068052610580516106a0526105a0516106c0526105c0516106e0526105e051610700526106005161072052602061062061010461063c5f855af1611773573d5f5f3e3d5ffd5b60203d10611894576106209050516103c0525b6001610500526020610500f35b5f5ffd5b60605160e05260e0601d8101805161012052506003610100526101009050805160a052602081015160c0525060405161012052610120600c8101805161016052506014610140526101409050805160e0526020810151610100525060805161016052610160600c810180516101a052506014610180526101809050805161012052602081015161014052505f60e051816101e0016101005181525080820191505060a051816101e00160c05181525080820191505061012051816101e00161014051815250808201915050806101c0526101c09050602081510180610160828460045afa5050506020610160510180828261016060045afa505050565b5f80fd036602001793001805211793179302d61793841918aa811200a16576797065728300030a0014';

const tokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"burnFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"initialSupply","type":"uint256"},{"name":"tokenName","type":"string"},{"name":"tokenSymbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"}];

const sushiswapABI =
[{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

sushi3ABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH9","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"uint256","name":"amountIn","type":"uint256"}],"name":"quoteExactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint160[]","name":"sqrtPriceX96AfterList","type":"uint160[]"},{"internalType":"uint32[]","name":"initializedTicksCrossedList","type":"uint32[]"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct IQuoterV2.QuoteExactInputSingleParams","name":"params","type":"tuple"}],"name":"quoteExactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceX96After","type":"uint160"},{"internalType":"uint32","name":"initializedTicksCrossed","type":"uint32"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"quoteExactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160[]","name":"sqrtPriceX96AfterList","type":"uint160[]"},{"internalType":"uint32[]","name":"initializedTicksCrossedList","type":"uint32[]"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct IQuoterV2.QuoteExactOutputSingleParams","name":"params","type":"tuple"}],"name":"quoteExactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceX96After","type":"uint160"},{"internalType":"uint32","name":"initializedTicksCrossed","type":"uint32"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},{"internalType":"int256","name":"amount1Delta","type":"int256"},{"internalType":"bytes","name":"path","type":"bytes"}],"name":"uniswapV3SwapCallback","outputs":[],"stateMutability":"view","type":"function"}];

uniswap4ABI = [{"inputs":[{"internalType":"contract IPoolManager","name":"_poolManager","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"PoolId","name":"poolId","type":"bytes32"}],"name":"NotEnoughLiquidity","type":"error"},{"inputs":[],"name":"NotPoolManager","type":"error"},{"inputs":[],"name":"NotSelf","type":"error"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"QuoteSwap","type":"error"},{"inputs":[],"name":"UnexpectedCallSuccess","type":"error"},{"inputs":[{"internalType":"bytes","name":"revertData","type":"bytes"}],"name":"UnexpectedRevertBytes","type":"error"},{"inputs":[{"components":[{"internalType":"Currency","name":"exactCurrency","type":"address"},{"components":[{"internalType":"Currency","name":"intermediateCurrency","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct PathKey[]","name":"path","type":"tuple[]"},{"internalType":"uint128","name":"exactAmount","type":"uint128"}],"internalType":"struct IV4Quoter.QuoteExactParams","name":"params","type":"tuple"}],"name":"_quoteExactInput","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"internalType":"struct PoolKey","name":"poolKey","type":"tuple"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"uint128","name":"exactAmount","type":"uint128"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct IV4Quoter.QuoteExactSingleParams","name":"params","type":"tuple"}],"name":"_quoteExactInputSingle","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"Currency","name":"exactCurrency","type":"address"},{"components":[{"internalType":"Currency","name":"intermediateCurrency","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct PathKey[]","name":"path","type":"tuple[]"},{"internalType":"uint128","name":"exactAmount","type":"uint128"}],"internalType":"struct IV4Quoter.QuoteExactParams","name":"params","type":"tuple"}],"name":"_quoteExactOutput","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"internalType":"struct PoolKey","name":"poolKey","type":"tuple"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"uint128","name":"exactAmount","type":"uint128"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct IV4Quoter.QuoteExactSingleParams","name":"params","type":"tuple"}],"name":"_quoteExactOutputSingle","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"poolManager","outputs":[{"internalType":"contract IPoolManager","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"Currency","name":"exactCurrency","type":"address"},{"components":[{"internalType":"Currency","name":"intermediateCurrency","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct PathKey[]","name":"path","type":"tuple[]"},{"internalType":"uint128","name":"exactAmount","type":"uint128"}],"internalType":"struct IV4Quoter.QuoteExactParams","name":"params","type":"tuple"}],"name":"quoteExactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"internalType":"struct PoolKey","name":"poolKey","type":"tuple"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"uint128","name":"exactAmount","type":"uint128"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct IV4Quoter.QuoteExactSingleParams","name":"params","type":"tuple"}],"name":"quoteExactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"Currency","name":"exactCurrency","type":"address"},{"components":[{"internalType":"Currency","name":"intermediateCurrency","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct PathKey[]","name":"path","type":"tuple[]"},{"internalType":"uint128","name":"exactAmount","type":"uint128"}],"internalType":"struct IV4Quoter.QuoteExactParams","name":"params","type":"tuple"}],"name":"quoteExactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"internalType":"struct PoolKey","name":"poolKey","type":"tuple"},{"internalType":"bool","name":"zeroForOne","type":"bool"},{"internalType":"uint128","name":"exactAmount","type":"uint128"},{"internalType":"bytes","name":"hookData","type":"bytes"}],"internalType":"struct IV4Quoter.QuoteExactSingleParams","name":"params","type":"tuple"}],"name":"quoteExactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"data","type":"bytes"}],"name":"unlockCallback","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"nonpayable","type":"function"}];

const addressMap = {
  wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  wmatic: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  cbwbtc: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'
};

const feeMapping = {
  wmatic: BigInt(14000000000000000),
  wbtc: BigInt(5),
  weth: BigInt(1900000000000),
  usdc: BigInt(4900),
  usdt: BigInt(4900),
  usdb: BigInt(4900),
  cbwbtc: BigInt(5)
}

const passList = [
  "dooar-ethereum",
  "sushiswap",
  "uniswap_v3",
  "sushiswap-v3-ethereum",
  "uniswap_v2",
  "pancakeswap-v3-ethereum",
  "uniswap-v4-ethereum"
]

const routes = {
  m:'0x10f4a785f458bc144e3706575924889954946639',
  u:'0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  j:'0x5C6EC38fb0e2609672BDf628B1fD605A523E5923',
  a:'0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607',
  q:'0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  s:'0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  r:'0x77F0e98e3F2F3134496C2B769f40c891351524d1'
};

const wmaticIn = BigInt('52000000000000000000');
const wbtcIn = BigInt('66000');
const usdcIn = BigInt('28000000');
const wethIn = BigInt('8500000000000000');
const daiIn = BigInt('5000000000000000000');
const usdtIn = BigInt('21500000');
const usdbIn = BigInt('65000000');
const cbwbtcIn = BigInt('40000');

const wm = BigInt('36000000000000000000');
const wb = BigInt('33000');
const usd = BigInt('5000000');
const weth = BigInt('13500000000000000');
const daiI = BigInt('5000000000000000000');
const ustIn = BigInt('16750000');
const usb = BigInt('16750000')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getUniswap4Quote(tokenIn, tokenOut, amountIn, fee) {
  const quoterAddress = '0x52F0E24D1c21C8A0cB1e5a5dD6198556BD9E1203';
  const quoterContract = new web3.eth.Contract(uniswap4ABI, quoterAddress);
  const [currency0, currency1] = tokenIn.toLowerCase() < tokenOut.toLowerCase()
    ? [tokenIn, tokenOut]
    : [tokenOut, tokenIn];
  const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();

  try {

    const params = {
      poolKey: {
        currency0,
        currency1,
        fee: Number(fee),
        tickSpacing: 60, // Double check this value
        hooks: '0x0000000000000000000000000000000000000000'
      },
      zeroForOne,
      exactAmount: BigInt(amountIn).toString(),
      hookData: '0x'
    };
    const response = await quoterContract.methods.quoteExactInputSingle(params).call();

    return response;
  } catch (error) {
    const revertData = error?.cause?.errorArgs?.revertData ||  error?.cause?.data;
    if (revertData?.startsWith('0x486aa307')) {
      console.error("Uniswap 4 Error: InsufficientOutputAmount - the expected amount out is too high.");
    } else {
      console.error("Uniswap 4 UNKNOWN ERROR:", error);
    }
    return null;
  }
}

// Example function to get a quote
async function getUniswapQuote(tokenIn, tokenOut, amountIn, fee) {

  //Uniswap Quoter Address
  const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

  // Create a new contract instance using ABI from Interface
  const quoterContract = new web3.eth.Contract(IQuoter.abi, quoterAddress);

  try {
    const sqrtPriceLimitX96 = '0'; // Example sqrtPriceLimitX96

    // Call the quoteExactInputSingle method
    const response = await quoterContract.methods['quoteExactInputSingle'](
      tokenIn,
      tokenOut,
      fee,
      amountIn,
      sqrtPriceLimitX96
    ).call();

    return response
  } catch (error) {
    console.log('Error fetching Uniswap 3 quote:', error);
    return null;
  }
}

// Example function to get a quote
async function getPancakeQuote(tokenIn, tokenOut, amountIn, fee) {

  //Uniswap Quoter Address
  const quoterAddress = '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997';

  // Create a new contract instance using ABI from Interface
  const quoterContract = new web3.eth.Contract(IQuoter.abi, quoterAddress);

  try {
    const sqrtPriceLimitX96 = '0'; // Example sqrtPriceLimitX96

    // Call the quoteExactInputSingle method
    const response = await quoterContract.methods['quoteExactInputSingle'](
      tokenIn,
      tokenOut,
      fee,
      amountIn,
      sqrtPriceLimitX96
    ).call();

    return response
  } catch (error) {
    console.error('Error fetching Pancakeswap quote:', error);
    return null;
  }
}

async function getSS3Quote(tokenIn, tokenOut, amountIn, fee) {

  const routerAddress = '0x64e8802FE490fa7cc61d3463958199161Bb608A7';

  try{
    const params = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0
    };
    const routerContract = new web3.eth.Contract(sushi3ABI, routerAddress);
    const quote = await routerContract.methods['quoteExactInputSingle'](params).call();
    return quote.amountOut;
  }
  catch (error){
    console.error('Error fetching Sushiswap 3 quote:', error);
    return null
  }
}

// Example function to get a quote
async function getSushiswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';

  // Create a new contract instance using ABI from Interface
  const sushiswapContract = new web3.eth.Contract(sushiswapABI, routerAddress);

  try {
        const amountsOut = await sushiswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      }
  catch (error) {
    console.log('Error fetching Sushiswap 2 quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getDooarQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x53e0e51b5Ed9202110D7Ecd637A4581db8b9879F';

  // Create a new contract instance using ABI from Interface
  const quoterContract = new web3.eth.Contract(sushiswapABI, routerAddress);

  try {
    const amountsOut = await quoterContract.methods['getAmountsOut'](amountIn, path).call();
    const amountOut = amountsOut[amountsOut.length - 1];
    return amountOut;
  }
  catch (error) {
    console.error('Error fetching Dooar quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getMaverickQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xb40AfdB85a07f37aE217E7D6462e609900dD8D7A';

  // Create a new contract instance using ABI from Interface
  const quoterContract = new web3.eth.Contract(sushiswapABI, routerAddress);

  try {
    const amountsOut = await quoterContract.methods['getAmountsOut'](amountIn, path).call();
    const amountOut = amountsOut[amountsOut.length - 1];
    return amountOut;
  }
  catch (error) {
    console.log('Error fetching Maverick quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getUniswap2Quote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

  // Create a new contract instance using ABI from Interface
  const quoterContract = new web3.eth.Contract(sushiswapABI, routerAddress);

  try {
    const amountsOut = await quoterContract.methods['getAmountsOut'](amountIn, path).call();
    const amountOut = amountsOut[amountsOut.length - 1];
    return amountOut;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }

}

async function executeTwoSequence(checkList) {

    //const routerList = name.split("");
      let firstHopAmount;
      let secondHopAmount;

      let routerOne;
      let routerTwo;

      let amountIn;
      let revisedAmount;

      console.log("Beginning Maximum Extractable Value Check - Depth = 3");

      for (const tradeObj of checkList){

        if (tradeObj.tokens[0].toLowerCase() == addressMap.wbtc.toLowerCase()){
          amountIn = wbtcIn;
          revisedAmount = amountIn + feeMapping.wbtc;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdc.toLowerCase()){
          amountIn = usdcIn;
          revisedAmount = amountIn + feeMapping.usdc;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdt.toLowerCase()){
          amountIn = usdtIn;
          revisedAmount = amountIn + feeMapping.usdt;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.weth.toLowerCase()){
          amountIn = wethIn;
          revisedAmount = amountIn + feeMapping.weth;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.wmatic.toLowerCase()){
          amountIn = wmaticIn;
          revisedAmount = amountIn + feeMapping.wmatic;
        }

        if (!passList.includes(tradeObj.dexes[0]) || !passList.includes(tradeObj.dexes[1]) || !passList.includes(tradeObj.dexes[0])){
          //console.log("Dex not in available listing: ", tradeObj.dexes);
          continue;
        }

        if (tradeObj.dexes[0] == "uniswap_v3"){
          firstHopAmount = await getUniswapQuote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswapSwapRouter;
        }

        else if (tradeObj.dexes[0] == "uniswap-v4-ethereum"){
          firstHopAmount = await getUniswap4Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap4Router;
        }

        else if (tradeObj.dexes[0] == "sushiswap-v3-ethereum"){
          firstHopAmount = await getSS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = s3Router;
        }
        else if (tradeObj.dexes[0] == "sushiswap"){
          firstHopAmount = await getSushiswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = sushiswapRouter;
        }
        else if (tradeObj.dexes[0] == "dooar-ethereum"){
          firstHopAmount = await getDooarQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dooarRouter;
        }
        else if (tradeObj.dexes[0] == "uniswap_v2"){
          firstHopAmount = await getUniswap2Quote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap2Router;
        }

        if (tradeObj.dexes[1] == "uniswap_v3"){
          secondHopAmount = await getUniswapQuote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap-v4-ethereum"){
          secondHopAmount = await getUniswap4Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap4Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap-v3-ethereum"){
          secondHopAmount = await getSS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = s3Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap"){
          secondHopAmount = await getSushiswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = sushiswapRouter;
        }
        else if (tradeObj.dexes[1] == "dooar-ethereum"){
          secondHopAmount = await getDooarQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dooarRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap_v2"){
          secondHopAmount = await getUniswap2Quote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap2Router;
        }

        if (revisedAmount < secondHopAmount){

          try{
            console.log('Success \nSequence: ', tradeObj.tokens);
            console.log(`Winning Total: ${secondHopAmount}`);
            console.log("FEES: ", tradeObj.fees);
            console.log("Dexs: ", tradeObj.dexes);
            /*console.log("Preparing Swaps...")

            //Access MEV smart contract for swappoing
            const swapContract = await new web3.eth.Contract(mevABI, mevBotAddress);

            //Acquire Account via PK
            const account = web3.eth.accounts.privateKeyToAccount(signature);

            //Get account nonce
            const nonce = await web3.eth.getTransactionCount(account.address);

            //Build Swap Transaction and Encode
            const swapData = swapContract.methods.TriDexSwap(
                                                            routerOne,
                                                            routerTwo,
                                                            routerThree,
                                                            tradeObj.tokens[0],
                                                            tradeObj.tokens[1],
                                                            tradeObj.tokens[2],
                                                            amountIn.toString(),
                                                            firstHopAmount.toString(),
                                                            secondHopAmount.toString(),
                                                            thirdHopAmount.toString(),
                                                            tradeObj.fees[0],
                                                            tradeObj.fees[1],
                                                            tradeObj.fees[2]).encodeABI();

            // Build Transaction Parameters
            const txParameters = {
              from: account.address,
              to: swapContract.options.address,
              data: swapData,
              nonce: web3.utils.toHex(nonce),
            };

            //Gas Calculations
            let gasEstimate = await web3.eth.estimateGas(txParameters);
            let gasPrice = await web3.eth.getGasPrice();
            let gasFee = gasEstimate * BigInt(3);

            console.log("GAS :", gasFee);

            //Completed tx object
            const txObject = {
              ...txParameters,
              gasPrice: web3.utils.toHex(gasPrice),
              gas: web3.utils.toHex(gasFee),
            };

            //Sign Transaction
            const signedTransaction = await web3.eth.accounts.signTransaction(txObject, signature);

            // Send the transaction to the Polygon network
            const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

            console.log("Transaction Hash: ", receipt.transactionHash);*/

          }
          catch (error) {
              if (error.data && error.data.message) {
                  console.error("Revert reason:", error.data.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.message.includes("revert")) {
                  console.error("Reverted without a reason:", error.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.cause && error.cause.message) {
                  const errorMessage = error.cause.message.toLowerCase();

                  if (errorMessage.includes("too little received")) {
                      console.error("Error: Too little received. The output amount was lower than expected.");
                  } else if (errorMessage.includes("insufficient_output_amount")) {
                      console.error("Error: The trade failed due to insufficient output.");
                  }
                  else{
                    console.error("Error Revert Reason:", error.cause.message);
                  }
              }
              else {
                  console.error("ERROR: ", error);
              }
          }

        }

      }
      console.log("MEV Process Complete");
}

async function executeThreeSequence(checkList) {

    //const routerList = name.split("");
      let firstHopAmount;
      let secondHopAmount;
      let thirdHopAmount;

      let routerOne;
      let routerTwo;
      let routerThree;

      let amountIn;
      let revisedAmount;
      let currentPrice;
      let amountInUSD;
      let thirdHopUSD;

      console.log("Fetching WBTC and WETH prices");

      const currentPrices = await fetchPrices();

      console.log("Beginning Maximum Extractable Value Check - Depth = 3");

      for (const tradeObj of checkList){

        if (tradeObj.tokens[0].toLowerCase() == addressMap.wbtc.toLowerCase()){
          amountIn = wbtcIn;
          //revisedAmount = amountIn + feeMapping.wbtc;
          currentprice = currentPrices[0];
          amountInUSD = parseFloat(amountIn) * currentPrices[0];
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdc.toLowerCase()){
          amountIn = usdcIn;
          //revisedAmount = amountIn + feeMapping.usdc;
          currentPrice = 1;
          amountInUSD = parseFloat(amountIn);
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdt.toLowerCase()){
          amountIn = usdtIn;
          //revisedAmount = amountIn + feeMapping.usdt;
          currentPrice = 1;
          amountInUSD = parseFloat(amountIn);
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.weth.toLowerCase()){
          amountIn = wethIn;
          //revisedAmount = amountIn + feeMapping.weth;
          currentPrice = currentPrices[1];
          amountInUSD = parseFloat(amountIn) * currentPrices[1]
        }

        if (!passList.includes(tradeObj.dexes[0]) || !passList.includes(tradeObj.dexes[1]) || !passList.includes(tradeObj.dexes[2])){
          console.log("Dex not in available listing: ", tradeObj.dexes);
          continue;
        }

        if (tradeObj.dexes[0] == "uniswap_v3"){
          firstHopAmount = await getUniswapQuote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount == null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswapSwapRouter;
        }

        else if (tradeObj.dexes[0] == "uniswap-v4-ethereum"){
          firstHopAmount = await getUniswap4Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount == null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap4Router;
        }

        else if (tradeObj.dexes[0] == "sushiswap-v3-ethereum"){
          firstHopAmount = await getSS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount == null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = s3Router;
        }
        else if (tradeObj.dexes[0] == "sushiswap"){
          firstHopAmount = await getSushiswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount == null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = sushiswapRouter;
        }
        else if (tradeObj.dexes[0] == "dooar-ethereum"){
          firstHopAmount = await getDooarQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount == null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dooarRouter;
        }
        else if (tradeObj.dexes[0] == "uniswap_v2"){
          firstHopAmount = await getUniswap2Quote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount == null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap2Router;
        }

        if (tradeObj.dexes[1] == "uniswap_v3"){
          secondHopAmount = await getUniswapQuote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount == null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap_v4_ethereum"){
          secondHopAmount = await getUniswap4Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount == null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap4Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap-v3-ethereum"){
          secondHopAmount = await getSS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount == null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = s3Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap"){
          secondHopAmount = await getSushiswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount == null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = sushiswapRouter;
        }
        else if (tradeObj.dexes[1] == "dooar-ethereum"){
          secondHopAmount = await getDooarQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount == null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dooarRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap_v2"){
          secondHopAmount = await getUniswap2Quote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount == null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap2Router;
        }

        if (tradeObj.dexes[2] == "uniswap_v3"){
          thirdHopAmount = await getUniswapQuote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount == null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap_v4_ethereum"){
          thirdHopAmount = await getUniswap4Quote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount == null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap4Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap-v3-ethereum"){
          thirdHopAmount = await getSS3Quote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount == null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = s3Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap"){
          thirdHopAmount = await getSushiswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (thirdHopAmount == null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = sushiswapRouter;
        }
        else if (tradeObj.dexes[2] == "dooar-ethereum"){
          thirdHopAmount = await getDooarQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (thirdHopAmount == null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dooarRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap_v2"){
          thirdHopAmount = await getUniswap2Quote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (thirdHopAmount == null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap2Router;
        }

        thirdHopUSD = parseFloat(thirdHopAmount) * currentPrice;

        if (amountIn < thirdHopAmount){

          try{
            /*console.log('Success \nSequence: ', tradeObj.tokens);
            console.log(`Winning Total: ${thirdHopAmount}`);
            console.log("FEES: ", tradeObj.fees);
            console.log("Dexs: ", tradeObj.dexes);
            console.log("Preparing Swaps...")*/

            console.log("Swap identified. Performing gas cost analysis.");

            //Access MEV smart contract for swappoing
            const swapContract = await new web3.eth.Contract(mevABI, mevBotAddress);

            //Acquire Account via PK
            const account = web3.eth.accounts.privateKeyToAccount(signature);

            //Get account nonce
            const nonce = await web3.eth.getTransactionCount(account.address);

            //Build Swap Transaction and Encode
            const swapData = swapContract.methods.TriDexSwap(
                                                            routerOne,
                                                            routerTwo,
                                                            routerThree,
                                                            tradeObj.tokens[0],
                                                            tradeObj.tokens[1],
                                                            tradeObj.tokens[2],
                                                            amountIn.toString(),
                                                            firstHopAmount.toString(),
                                                            secondHopAmount.toString(),
                                                            thirdHopAmount.toString(),
                                                            tradeObj.fees[0],
                                                            tradeObj.fees[1],
                                                            tradeObj.fees[2]).encodeABI();

            // Build Transaction Parameters
            const txParameters = {
              from: account.address,
              to: swapContract.options.address,
              data: swapData,
              nonce: web3.utils.toHex(nonce),
            };

            //Gas Calculations
            let gasEstimate = await web3.eth.estimateGas(txParameters);
            let gasPrice = await web3.eth.getGasPrice();

            const gasFeeWei = BigInt(gasEstimate) * BigInt(gasPrice);
            const gasFeeEth = Number(web3.utils.fromWei(gasFeeWei.toString(), 'ether'));
            const gasCostUsd = gasFeeEth * currentPrices[1];

            if((thirdHopUSD + gasCostUsd) < amountInUSD){
              console.log("Gas cost analysis: FAIL")
              continue;
            }

            console.log("Gas cost analysis: SUCCESS")
            console.log("Sending transaction")

            //Completed tx object
            const txObject = {
              ...txParameters,
              gasPrice: web3.utils.toHex(gasPrice),
              gas: web3.utils.toHex(gasEstimate),
            };

            //Sign Transaction
            const signedTransaction = await web3.eth.accounts.signTransaction(txObject, signature);

            // Send the transaction to the Polygon network
            const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

            console.log("Transaction Hash: ", receipt.transactionHash);

          }
          catch (error) {
              if (error.data && error.data.message) {
                  console.error("Revert reason:", error.data.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.message.includes("revert")) {
                  console.error("Reverted without a reason:", error.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.cause && error.cause.message) {
                  const errorMessage = error.cause.message.toLowerCase();

                  if (errorMessage.includes("too little received")) {
                      console.error("Error: Too little received. The output amount was lower than expected.");
                  } else if (errorMessage.includes("insufficient_output_amount")) {
                      console.error("Error: The trade failed due to insufficient output.");
                  }
                  else{
                    console.error("Error Revert Reason:", error.cause.message);
                  }
              }
              else {
                  console.error("ERROR: ", error);
              }
          }

        }

        await sleep(1000);

      }
      console.log("MEV Process Complete");
}


async function executeFourSequence(checkList) {

    //const routerList = name.split("");
      let firstHopAmount;
      let secondHopAmount;
      let thirdHopAmount;
      let fourthHopAmount;
      let fifthHopAmount;
      let sixthHopAmount;

      let routerOne;
      let routerTwo;
      let routerThree;
      let routerFour;
      let routerFive;
      let routerSix;

      let amountIn;
      let revisedAmount;

      console.log("Beginning Maximum Extractable Value Check - Depth = 4");

      for (const tradeObj of checkList){

        if (tradeObj.tokens[0].toLowerCase() == addressMap.wbtc.toLowerCase()){
          amountIn = wbtcIn;
          revisedAmount = amountIn //+ feeMapping.wbtc;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdc.toLowerCase()){
          amountIn = usdcIn;
          revisedAmount = amountIn //+ feeMapping.usdc;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdt.toLowerCase()){
          amountIn = usdtIn;
          revisedAmount = amountIn //+ feeMapping.usdt;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.weth.toLowerCase()){
          amountIn = wethIn;
          revisedAmount = amountIn //+ feeMapping.weth;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.wmatic.toLowerCase()){
          amountIn = wmaticIn;
          revisedAmount = amountIn //+ feeMapping.wmatic;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.cbwbtc.toLowerCase()){
          amountIn = cbwbtcIn;
          revisedAmount = amountIn //+ feeMapping.cbwbtc
        }

        if (!passList.includes(tradeObj.dexes[0]) || !passList.includes(tradeObj.dexes[1]) || !passList.includes(tradeObj.dexes[2]) || !passList.includes(tradeObj.dexes[3]) ){
          console.log("Dex not in available listing: ", tradeObj.dexes);
          continue;
        }

        if (tradeObj.dexes[0] == "uniswap_v3"){
          firstHopAmount = await getUniswapQuote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount: ', tradeObj.dexes[0]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswapSwapRouter;
        }
        if (tradeObj.dexes[0] == "uniswap_v4_ethereum"){
          firstHopAmount = await getUniswap4Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount: ', tradeObj.dexes[0]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap4Router;
        }

        else if (tradeObj.dexes[0] == "sushiswap-v3-ethereum"){
          firstHopAmount = await getSS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount: ', tradeObj.dexes[0]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = s3Router;
        }
        else if (tradeObj.dexes[0] == "sushiswap"){
          firstHopAmount = await getSushiswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount: ', tradeObj.dexes[0]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = sushiswapRouter;
        }
        else if (tradeObj.dexes[0] == "dooar-ethereum"){
          firstHopAmount = await getDooarQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount: ', tradeObj.dexes[0]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dooarRouter;
        }
        else if (tradeObj.dexes[0] == "uniswap_v2"){
          firstHopAmount = await getUniswap2Quote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount: ', tradeObj.dexes[0]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap2Router;
        }

        if (tradeObj.dexes[1] == "uniswap_v3"){
          secondHopAmount = await getUniswapQuote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount: ', tradeObj.dexes[1]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap_v4_ethereum"){
          secondHopAmount = await getUniswap4Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount: ', tradeObj.dexes[1]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap4Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap-v3-ethereum"){
          secondHopAmount = await getSS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount: ', tradeObj.dexes[1]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = s3Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap"){
          secondHopAmount = await getSushiswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount: ', tradeObj.dexes[1]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = sushiswapRouter;
        }
        else if (tradeObj.dexes[1] == "dooar-ethereum"){
          secondHopAmount = await getDooarQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount: ', tradeObj.dexes[1]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dooarRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap_v2"){
          secondHopAmount = await getUniswap2Quote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount: ', tradeObj.dexes[1]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap2Router;
        }

        if (tradeObj.dexes[2] == "uniswap_v3"){
          thirdHopAmount = await getUniswapQuote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap_v4_ethereum"){
          thirdHopAmount = await getUniswap4Quote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap4Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap-v3-ethereum"){
          thirdHopAmount = await getSS3Quote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = s3Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap"){
          thirdHopAmount = await getSushiswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = sushiswapRouter;
        }
        else if (tradeObj.dexes[2] == "dooar-ethereum"){
          thirdHopAmount = await getDooarQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dooarRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap_v2"){
          thirdHopAmount = await getUniswap2Quote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap2Router;
        }


        if (tradeObj.dexes[3] == "uniswap_v3"){
          fourthHopAmount = await getUniswapQuote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[3] == "uniswap_v4_ethereum"){
          fourthHopAmount = await getUniswap4Quote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswap4Router;
        }
        else if (tradeObj.dexes[3] == "sushiswap-v3-ethereum"){
          fourthHopAmount = await getSS3Quote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = s3Router;
        }
        else if (tradeObj.dexes[3] == "sushiswap"){
          fourthHopAmount = await getSushiswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = sushiswapRouter;
        }
        else if (tradeObj.dexes[3] == "dooar-ethereum"){
          fourthHopAmount = await getDooarQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = dooarRouter;
        }
        else if (tradeObj.dexes[3] == "uniswap_v2"){
          fourthHopAmount = await getUniswap2Quote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount: ', tradeObj.dexes[2]);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswap2Router;
        }

        if (revisedAmount < fourthHopAmount){

          try{
            console.log('Success \nSequence: ', tradeObj.tokens);
            console.log(`Winning Total: ${thirdHopAmount}`);
            console.log("FEES: ", tradeObj.fees);
            console.log("Dexs: ", tradeObj.dexes);
            /*console.log("Preparing Swaps...")

            //Access MEV smart contract for swappoing
            const swapContract = await new web3.eth.Contract(mevABI, mevBotAddress);

            //Acquire Account via PK
            const account = web3.eth.accounts.privateKeyToAccount(signature);

            //Get account nonc
            const nonce = await web3.eth.getTransactionCount(account.address);

            //Build Swap Transaction and Encode
            const swapData = swapContract.methods.TriDexSwap(
                                                            routerOne,
                                                            routerTwo,
                                                            routerThree,
                                                            tradeObj.tokens[0],
                                                            tradeObj.tokens[1],
                                                            tradeObj.tokens[2],
                                                            amountIn.toString(),
                                                            firstHopAmount.toString(),
                                                            secondHopAmount.toString(),
                                                            thirdHopAmount.toString(),
                                                            tradeObj.fees[0],
                                                            tradeObj.fees[1],
                                                            tradeObj.fees[2]).encodeABI();

            // Build Transaction Parameters
            const txParameters = {
              from: account.address,
              to: swapContract.options.address,
              data: swapData,
              nonce: web3.utils.toHex(nonce),
            };

            //Gas Calculations
            let gasEstimate = await web3.eth.estimateGas(txParameters);
            let gasPrice = await web3.eth.getGasPrice();
            let gasFee = gasEstimate * BigInt(3);

            console.log("GAS :", gasFee);

            //Completed tx object
            const txObject = {
              ...txParameters,
              gasPrice: web3.utils.toHex(gasPrice),
              gas: web3.utils.toHex(gasFee),
            };

            //Sign Transaction
            const signedTransaction = await web3.eth.accounts.signTransaction(txObject, signature);

            // Send the transaction to the Polygon network
            const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

            console.log("Transaction Hash: ", receipt.transactionHash);*/

          }
          catch (error) {
              if (error.data && error.data.message) {
                  console.error("Revert reason:", error.data.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.message.includes("revert")) {
                  console.error("Reverted without a reason:", error.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.cause && error.cause.message) {
                  const errorMessage = error.cause.message.toLowerCase();

                  if (errorMessage.includes("too little received")) {
                      console.error("Error: Too little received. The output amount was lower than expected.");
                  } else if (errorMessage.includes("insufficient_output_amount")) {
                      console.error("Error: The trade failed due to insufficient output.");
                  }
                  else{
                    console.error("Error Revert Reason:", error.cause.message);
                  }
              }
              else {
                  console.error("ERROR: ", error);
              }
          }

        }

      }
      console.log("MEV Process Complete");
}


async function executeSixSequence(checkList) {

    //const routerList = name.split("");
      let firstHopAmount;
      let secondHopAmount;
      let thirdHopAmount;
      let fourthHopAmount;
      let fifthHopAmount;
      let sixthHopAmount;

      let routerOne;
      let routerTwo;
      let routerThree;
      let routerFour;
      let routerFive;
      let routerSix;

      let amountIn;
      let revisedAmount;

      console.log("Beginning Maximum Extractable Value Check");

      for (const tradeObj of checkList){

        if (tradeObj.tokens[0].toLowerCase() == addressMap.wbtc.toLowerCase()){
          amountIn = wbtcIn;
          revisedAmount = amountIn + feeMapping.wbtc;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdc.toLowerCase()){
          amountIn = usdcIn;
          revisedAmount = amountIn + feeMapping.usdc;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.usdt.toLowerCase()){
          amountIn = usdtIn;
          revisedAmount = amountIn + feeMapping.usdt;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.weth.toLowerCase()){
          amountIn = wethIn;
          revisedAmount = amountIn + feeMapping.weth;
        }
        if (tradeObj.tokens[0].toLowerCase() == addressMap.wmatic.toLowerCase()){
          amountIn = wmaticIn;
          revisedAmount = amountIn + feeMapping.wmatic;
        }

        if (!passList.includes(tradeObj.dexes[0]) || !passList.includes(tradeObj.dexes[1]) || !passList.includes(tradeObj.dexes[2]) || !passList.includes(tradeObj.dexes[3]) || !passList.includes(tradeObj.dexes[4]) || !passList.includes(tradeObj.dexes[5]) ){
          console.log("Dex not in available listing: ", tradeObj.dexes);
          continue;
        }

        if (tradeObj.dexes[0] == "uniswap_v3"){
          firstHopAmount = await getUniswapQuote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswapSwapRouter;
        }

        else if (tradeObj.dexes[0] == "sushiswap-v3-ethereum"){
          firstHopAmount = await getSS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = s3Router;
        }
        else if (tradeObj.dexes[0] == "sushiswap"){
          firstHopAmount = await getSushiswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = sushiswapRouter;
        }
        else if (tradeObj.dexes[0] == "dooar-ethereum"){
          firstHopAmount = await getDooarQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dooarRouter;
        }
        else if (tradeObj.dexes[0] == "uniswap_v2"){
          firstHopAmount = await getUniswap2Quote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (firstHopAmount === null || firstHopAmount === undefined || firstHopAmount.toString() === 'NaN') {
            console.error('Failed to get the first hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap2Router;
        }

        if (tradeObj.dexes[1] == "uniswap_v3"){
          secondHopAmount = await getUniswapQuote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[1] == "sushiswap-v3-ethereum"){
          secondHopAmount = await getSS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = s3Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap"){
          secondHopAmount = await getSushiswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = sushiswapRouter;
        }
        else if (tradeObj.dexes[1] == "dooar-ethereum"){
          secondHopAmount = await getDooarQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dooarRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap_v2"){
          secondHopAmount = await getUniswap2Quote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (secondHopAmount === null || secondHopAmount === undefined || secondHopAmount.toString() === 'NaN') {
            console.error('Failed to get the second hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap2Router;
        }

        if (tradeObj.dexes[2] == "uniswap_v3"){
          thirdHopAmount = await getUniswapQuote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[2] == "sushiswap-v3-ethereum"){
          thirdHopAmount = await getSS3Quote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = s3Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap"){
          thirdHopAmount = await getSushiswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = sushiswapRouter;
        }
        else if (tradeObj.dexes[2] == "dooar-ethereum"){
          thirdHopAmount = await getDooarQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dooarRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap_v2"){
          thirdHopAmount = await getUniswap2Quote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (thirdHopAmount === null || thirdHopAmount === undefined || thirdHopAmount.toString() === 'NaN') {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap2Router;
        }


        if (tradeObj.dexes[3] == "uniswap_v3"){
          fourthHopAmount = await getUniswapQuote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[3] == "sushiswap-v3-ethereum"){
          fourthHopAmount = await getSS3Quote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = s3Router;
        }
        else if (tradeObj.dexes[3] == "sushiswap"){
          fourthHopAmount = await getSushiswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = sushiswapRouter;
        }
        else if (tradeObj.dexes[3] == "dooar-ethereum"){
          fourthHopAmount = await getDooarQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = dooarRouter;
        }
        else if (tradeObj.dexes[3] == "uniswap_v2"){
          fourthHopAmount = await getUniswap2Quote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswap2Router;
        }

        if (tradeObj.dexes[4] == "uniswap_v3"){
          fifthHopAmount = await getUniswapQuote(tradeObj.tokens[4], tradeObj.tokens[5], fourthHopAmount.toString(), tradeObj.fees[4]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[4] == "sushiswap-v3-ethereum"){
          fifthHopAmount = await getSS3Quote(tradeObj.tokens[4], tradeObj.tokens[5], fourthHopAmount.toString(), tradeObj.fees[4]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = s3Router;
        }
        else if (tradeObj.dexes[4] == "sushiswap"){
          fifthHopAmount = await getSushiswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = sushiswapRouter;
        }
        else if (tradeObj.dexes[4] == "dooar-ethereum"){
          fifthHopAmount = await getDooarQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = dooarRouter;
        }
        else if (tradeObj.dexes[4] == "uniswap_v2"){
          fifthHopAmount = await getUniswap2Quote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = uniswap2Router;
        }

        if (tradeObj.dexes[5] == "uniswap_v3"){
          sixthHopAmount = await getUniswapQuote(tradeObj.tokens[5], tradeObj.tokens[0], fifthHopAmount.toString(), tradeObj.fees[5]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[5] == "sushiswap-v3-ethereum"){
          sixthHopAmount = await getSS3Quote(tradeObj.tokens[5], tradeObj.tokens[0], fifthHopAmount.toString(), tradeObj.fees[5]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = s3Router;
        }
        else if (tradeObj.dexes[5] == "sushiswap"){
          sixthHopAmount = await getSushiswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = sushiswapRouter;
        }
        else if (tradeObj.dexes[5] == "dooar-ethereum"){
          sixthHopAmount = await getDooarQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = dooarRouter;
        }
        else if (tradeObj.dexes[5] == "uniswap_v2"){
          sixthHopAmount = await getUniswap2Quote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount');
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = uniswap2Router;
        }

        if (revisedAmount < sixthHopAmount){

          try{
            console.log('Success \nSequence: ', tradeObj.tokens);
            console.log(`Winning Total: ${thirdHopAmount}`);
            console.log("FEES: ", tradeObj.fees);
            console.log("Dexs: ", tradeObj.dexes);
            /*console.log("Preparing Swaps...")

            //Access MEV smart contract for swappoing
            const swapContract = await new web3.eth.Contract(mevABI, mevBotAddress);

            //Acquire Account via PK
            const account = web3.eth.accounts.privateKeyToAccount(signature);

            //Get account nonc
            const nonce = await web3.eth.getTransactionCount(account.address);

            //Build Swap Transaction and Encode
            const swapData = swapContract.methods.TriDexSwap(
                                                            routerOne,
                                                            routerTwo,
                                                            routerThree,
                                                            tradeObj.tokens[0],
                                                            tradeObj.tokens[1],
                                                            tradeObj.tokens[2],
                                                            amountIn.toString(),
                                                            firstHopAmount.toString(),
                                                            secondHopAmount.toString(),
                                                            thirdHopAmount.toString(),
                                                            tradeObj.fees[0],
                                                            tradeObj.fees[1],
                                                            tradeObj.fees[2]).encodeABI();

            // Build Transaction Parameters
            const txParameters = {
              from: account.address,
              to: swapContract.options.address,
              data: swapData,
              nonce: web3.utils.toHex(nonce),
            };

            //Gas Calculations
            let gasEstimate = await web3.eth.estimateGas(txParameters);
            let gasPrice = await web3.eth.getGasPrice();
            let gasFee = gasEstimate * BigInt(3);

            console.log("GAS :", gasFee);

            //Completed tx object
            const txObject = {
              ...txParameters,
              gasPrice: web3.utils.toHex(gasPrice),
              gas: web3.utils.toHex(gasFee),
            };

            //Sign Transaction
            const signedTransaction = await web3.eth.accounts.signTransaction(txObject, signature);

            // Send the transaction to the Polygon network
            const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

            console.log("Transaction Hash: ", receipt.transactionHash);*/

          }
          catch (error) {
              if (error.data && error.data.message) {
                  console.error("Revert reason:", error.data.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.message.includes("revert")) {
                  console.error("Reverted without a reason:", error.message);
                  //console.error("FULL ERROR: ", error);
              } else if (error.cause && error.cause.message) {
                  const errorMessage = error.cause.message.toLowerCase();

                  if (errorMessage.includes("too little received")) {
                      console.error("Error: Too little received. The output amount was lower than expected.");
                  } else if (errorMessage.includes("insufficient_output_amount")) {
                      console.error("Error: The trade failed due to insufficient output.");
                  }
                  else{
                    console.error("Error Revert Reason:", error.cause.message);
                  }
              }
              else {
                  console.error("ERROR: ", error);
              }
          }

        }

      }
      console.log("MEV Process Complete");
}



function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function CheckAndTrade(){

  const addressMap = ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'];
  let poolData;
  //poolData = await fetchAllTrendingPools();
  poolData = await fetchAllNewPools();

  const triangularTrades = findTriangularTrades(poolData.data, addressMap);
  //const swaps = generateSwapPaths(poolData.data, addressMap);
  const dexes = await getUniqueDexes(triangularTrades);
  const swaps = generateCorrectSwapPaths(poolData.data, addressMap);

  //await executeTwoSequence(swaps[2]);
  await executeThreeSequence(swaps[3]);
  //await executeFourSequence(swaps[4]);
  //await executeSixSequence(swaps[6]);

}

// Run the function immediately
CheckAndTrade();
