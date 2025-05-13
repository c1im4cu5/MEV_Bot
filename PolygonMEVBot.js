
const { Web3 }  = require('web3');
const { toHex, toBN } = require('web3-utils');
const BigNumber = require('bignumber.js');

const { Interface } = require('@ethersproject/abi');
const IQuoter = require('./node_modules/@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const { ChainId, Token, Fetcher, Route, Trade, TokenAmount, TradeType } = require('@quickswap/sdk');

const customOrders = require('./orders.json');

const {
  fetchTrendingPools,
  fetchAllTrendingPools,
  updatePoolDataWithAddressMap,
  findTriangularTrades,
  getUniqueDexes,
  generateSwapPaths
} = require('./GeckoTerminalExtract');


const mevBotAddress = '<DEPLOYED MEV BOT ADDRESS ON BLOCKCHAIN>';
const web3 = new Web3('<YOUR WEB3 URL>');
const signature = '<PRIVATE KEY OF ADDRESS THAT DEPLOYED MEV BOT ON BLOCKCHAIN>';


//Router Addresses
const sushiswapRouter = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
const apeswapRouter = '0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607';
const quickswapRouter = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';
const jetswapRouter = '0x5C6EC38fb0e2609672BDf628B1fD605A523E5923';
const meshswapRouter = '0x10f4a785f458bc144e3706575924889954946639';
const uniswapSwapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const uniswap2Router = '0xedf6066a2b290C185783862C7F4776A2C8077AD1';
const polycatRouter = '0x94930a328162957FF1dd48900aF67B5439336cBD';
const honeyRouter = '0xaD340d0CD0B117B0140671E7cB39770e7675C848';
const q3Router = '0xf5b509bB0909a69B1c207E495f687a596C168E12';
const s3Router = '0x0aF89E1620b96170e2a9D0b68fEebb767eD044c3';
const retro3Router = '0x1891783cb3497Fdad1F25C933225243c2c7c4102';
const retroRouter = '0x77F0e98e3F2F3134496C2B769f40c891351524d1';
const dooarRouter = '0xAcc8e414ceeCF0BBF438f6c4B7417Ca59dcF7E47';
const balancerRouter = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
const dfynRouter = '0xA102072A4C07F06EC3B4900FDC4C7B80b6c57429';

const mevABI = [{"stateMutability": "nonpayable", "type": "constructor", "inputs": [], "outputs": []}, {"stateMutability": "nonpayable", "type": "function", "name": "FundContractMEV", "inputs": [{"name": "_amount", "type": "uint256"}, {"name": "_token", "type": "address"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "changeV3Address", "inputs": [{"name": "_token", "type": "address"}, {"name": "_listSpace", "type": "uint24"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "payable", "type": "function", "name": "DepositMATIC", "inputs": [{"name": "_amount", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "recover", "inputs": [], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "recoverTokens", "inputs": [{"name": "tokenAddress", "type": "address"}, {"name": "_withdraw", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "TriDexSwap", "inputs": [{"name": "_route1", "type": "address"}, {"name": "_route2", "type": "address"}, {"name": "_route3", "type": "address"}, {"name": "_token1", "type": "address"}, {"name": "_token2", "type": "address"}, {"name": "_token3", "type": "address"}, {"name": "_amount", "type": "uint256"}, {"name": "_outMin1", "type": "uint256"}, {"name": "_outMin2", "type": "uint256"}, {"name": "_outMin3", "type": "uint256"}, {"name": "_fee1", "type": "uint24"}, {"name": "_fee2", "type": "uint24"}, {"name": "_fee3", "type": "uint24"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "nonpayable", "type": "function", "name": "DoubleDexSwap", "inputs": [{"name": "_route1", "type": "address"}, {"name": "_route2", "type": "address"}, {"name": "_token1", "type": "address"}, {"name": "_token2", "type": "address"}, {"name": "_amount", "type": "uint256"}, {"name": "_outMin1", "type": "uint256"}, {"name": "_outMin2", "type": "uint256"}, {"name": "_fee1", "type": "uint24"}, {"name": "_fee2", "type": "uint24"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "view", "type": "function", "name": "v3", "inputs": [{"name": "arg0", "type": "uint256"}], "outputs": [{"name": "", "type": "address"}]}];

const mevBytecode = '0x3461008957335f555f60015573f5b509bb0909a69b1c207e495f687a596c168e1260025573e592427a0aece92de3edee1f18e0157c05861564600355730af89e1620b96170e2a9d0b68feebb767ed044c3600455731891783cb3497fdad1f25c933225243c2c7c41026005555f6006555f6007555f60085561185b61008d6100003961185b610000f35b5f80fd5f3560e01c60026009820660011b61184901601e395f51565b6304ab87478118610045576024361034176118455760043560068111611845576002015460405260206040f35b636534489f81186118415761012436103417611845576004358060a01c611845576040526024358060a01c611845576060526044358060a01c611845576080526064358060a01c6118455760a05260e4358060181c6118455760c052610104358060181c6118455760e0525f54331815610140576025610100527f4f6e6c7920746865206f776e65722063616e2063616c6c20746869732066756e610120527f6374696f6e0000000000000000000000000000000000000000000000000000006101405261010050610100518061012001601f825f031636823750506308c379a060c052602060e052601f19601f61010051011660440160dcfd5b60805163095ea7b36101205260405161014052608435610160526020610120604461013c5f855af1610174573d5f5f3e3d5ffd5b60203d1061184557610120518060011c61184557610180526101809050516101005261010051610201576020610120527f546f6b656e206e6f7420617070726f76656420666f72207370656e64696e672e6101405261012050610120518061014001601f825f031636823750506308c379a060e052602061010052601f19601f61012051011660440160fcfd5b42601e810181811061184557905061012052604036610140376080516101a05260a0516101c05260026101805260a051610200526080516102205260026101e0526040515f610240525f6007905b8060020154831861026557600161024052610270565b60010181811861024f575b5050610240519050610366576040516338ed17396102605260a06040608461028037806102c05280610280015f610180518083528060051b5f82600281116118455780156102d857905b8060051b6101a001518160051b6020880101526001018181186102ba575b50508201602001915050905081019050306102e05261012051610300525061018061026061010461027c5f855af1610312573d5f5f3e3d5ffd5b60403d10611845576102605161026001600a81511161184557805160208160051b0180610400828560045afa505050506104009050600281511061184557600160051b6020820101905051610140526104f2565b6040515f610240525f6007905b8060020154831861038957600161024052610394565b600101818118610373575b5050610240519050156104f25760025460405118610449576080516102605260a05161028052306102a052610120516102c052604060846102e0375f6103205260405163bc65118861034052610260516103605261028051610380526102a0516103a0526102c0516103c0526102e0516103e05261030051610400526103205161042052602061034060e461035c5f855af1610432573d5f5f3e3d5ffd5b60203d1061184557610340905051610140526104f2565b6080516102605260a0516102805260c0516102a052306102c052610120516102e05260406084610300375f6103405260405163414bf389610360526102605161038052610280516103a0526102a0516103c0526102c0516103e0526102e05161040052610300516104205261032051610440526103405161046052602061036061010461037c5f855af16104df573d5f5f3e3d5ffd5b60203d1061184557610360905051610140525b60a05163095ea7b3610240526060516102605261014051610280526020610240604461025c5f855af1610527573d5f5f3e3d5ffd5b60203d1061184557610240518060011c611845576102a0526102a090505115611845576060515f610240525f6007905b8060020154831861056d57600161024052610578565b600101818118610557575b5050610240519050610675576060516338ed17396102605260a0610140516102805260c4356102a052806102c05280610280015f6101e0518083528060051b5f82600281116118455780156105e757905b8060051b61020001518160051b6020880101526001018181186105c9575b50508201602001915050905081019050306102e05261012051610300525061018061026061010461027c5f855af1610621573d5f5f3e3d5ffd5b60403d10611845576102605161026001600a81511161184557805160208160051b0180610400828560045afa505050506104009050600281511061184557600160051b60208201019050516101605261080f565b6060515f610240525f6007905b80600201548318610698576001610240526106a3565b600101818118610682575b50506102405190501561080f576002546060511861075f5760a0516102605260805161028052306102a052610120516102c052610140516102e05260c435610300525f6103205260605163bc65118861034052610260516103605261028051610380526102a0516103a0526102c0516103c0526102e0516103e05261030051610400526103205161042052602061034060e461035c5f855af1610748573d5f5f3e3d5ffd5b60203d10611845576103409050516101605261080f565b60a051610260526080516102805260e0516102a052306102c052610120516102e052610140516103005260c435610320525f6103405260605163414bf389610360526102605161038052610280516103a0526102a0516103c0526102c0516103e0526102e05161040052610300516104205261032051610440526103405161046052602061036061010461037c5f855af16107fc573d5f5f3e3d5ffd5b60203d1061184557610360905051610160525b6001610240526020610240f3611841565b6311d8d57e811861184157604436103417611845576024358060a01c611845576040526040516370a082316080523360a052602060806024609c845afa610869573d5f5f3e3d5ffd5b60203d106118455760809050516060526004356060511861088b576001610893565b600435606051115b6109175760266080527f4e6f7420656e6f75676820746f6b656e20696e2077616c6c657420746f20707260a0527f6f636565642e000000000000000000000000000000000000000000000000000060c0526080506080518060a001601f825f031636823750506308c379a06040526020606052601f19601f6080510116604401605cfd5b6040516323b872dd60a0523360c0523060e05260043561010052602060a0606460bc5f855af1610949573d5f5f3e3d5ffd5b60203d106118455760a0518060011c61184557610120526101209050516080526080516109cc57601960a0527f5472616e736665722077617320756e7375636365737366756c0000000000000060c05260a05060a0518060c001601f825f031636823750506308c379a06060526020608052601f19601f60a0510116604401607cfd5b600160a052602060a0f3611841565b639175d3d1811861184157604436103417611845576004358060a01c611845576040526024358060181c611845576060525f54331815610a7157601d6080527f4f6e6c79206f776e65722063616e207265636f76657220746f6b656e7300000060a0526080506080518060a001601f825f031636823750506308c379a06040526020606052601f19601f6080510116604401605cfd5b604051606051600681116118455760020155600160805260206080f3611841565b63691b30468118610ab157602336111561184557600160405260206040f35b63ce74602481186118415734611845575f54331815610b2557601d6040527f4f6e6c79206f776e65722063616e207265636f76657220746f6b656e7300000060605260405060405180606001601f825f031636823750506308c379a05f526020602052601f19601f6040510116604401601cfd5b5f5f5f5f47335ff11561184557600160405260206040f3611841565b63069c9fae811861184157604436103417611845576004358060a01c611845576040525f54331815610bed5760216060527f4f6e6c7920746865206f776e65722063616e207265636f76657220746f6b656e6080527f730000000000000000000000000000000000000000000000000000000000000060a05260605060605180608001601f825f031636823750506308c379a06020526020604052601f19601f6060510116604401603cfd5b6040516060526060516370a0823160a0523060c052602060a0602460bc845afa610c19573d5f5f3e3d5ffd5b60203d106118455760a090505160805260243560805111610c41576024356080511815610c44565b60015b610ca457601060a0527f4e6f7420656e6f7567682066756e64730000000000000000000000000000000060c05260a05060a0518060c001601f825f031636823750506308c379a06060526020608052601f19601f60a0510116604401607cfd5b60605163a9059cbb60a0523360c05260243560e052602060a0604460bc5f855af1610cd1573d5f5f3e3d5ffd5b60203d106118455760a0518060011c61184557610100526101005050600160a052602060a0f3611841565b63a5f79f548118611841576101a436103417611845576004358060a01c611845576040526024358060a01c611845576060526044358060a01c611845576080526064358060a01c6118455760a0526084358060a01c6118455760c05260a4358060a01c6118455760e052610144358060181c6118455761010052610164358060181c6118455761012052610184358060181c61184557610140525f54331815610e29576025610160527f4f6e6c7920746865206f776e65722063616e2063616c6c20746869732066756e610180527f6374696f6e0000000000000000000000000000000000000000000000000000006101a05261016050610160518061018001601f825f031636823750506308c379a061012052602061014052601f19601f61016051011660440161013cfd5b60a05163095ea7b3610180526040516101a05260c4356101c0526020610180604461019c5f855af1610e5d573d5f5f3e3d5ffd5b60203d1061184557610180518060011c611845576101e0526101e09050516101605261016051610eec576020610180527f546f6b656e206e6f7420617070726f76656420666f72207370656e64696e672e6101a0526101805061018051806101a001601f825f031636823750506308c379a061014052602061016052601f19601f61018051011660440161015cfd5b42601e8101818110611845579050610180526060366101a03760a0516102205260c0516102405260026102005260c0516102805260e0516102a05260026102605260e0516102e05260a0516103005260026102c0526040515f610320525f6007905b80600201548318610f6457600161032052610f6f565b600101818118610f4e575b5050610320519050611065576040516338ed17396103405260a0604060c461036037806103a05280610360015f610200518083528060051b5f8260028111611845578015610fd757905b8060051b61022001518160051b602088010152600101818118610fb9575b50508201602001915050905081019050306103c052610180516103e0525061018061034061010461035c5f855af1611011573d5f5f3e3d5ffd5b60403d10611845576103405161034001600a81511161184557805160208160051b01806104e0828560045afa505050506104e09050600281511061184557600160051b60208201019050516101a0526111f2565b6040515f610320525f6007905b8060020154831861108857600161032052611093565b600101818118611072575b5050610320519050156111f257600254604051186111485760a0516103405260c051610360523061038052610180516103a052604060c46103c0375f6104005260405163bc651188610420526103405161044052610360516104605261038051610480526103a0516104a0526103c0516104c0526103e0516104e0526104005161050052602061042060e461043c5f855af1611131573d5f5f3e3d5ffd5b60203d10611845576104209050516101a0526111f2565b60a0516103405260c051610360526101005161038052306103a052610180516103c052604060c46103e0375f6104205260405163414bf3896104405261034051610460526103605161048052610380516104a0526103a0516104c0526103c0516104e0526103e0516105005261040051610520526104205161054052602061044061010461045c5f855af16111df573d5f5f3e3d5ffd5b60203d10611845576104409050516101a0525b60c05163095ea7b361032052606051610340526101a051610360526020610320604461033c5f855af1611227573d5f5f3e3d5ffd5b60203d1061184557610320518060011c611845576103805261038090505115611845576060515f610320525f6007905b8060020154831861126d57600161032052611278565b600101818118611257575b5050610320519050611376576060516338ed17396103405260a06101a051610360526101043561038052806103a05280610360015f610260518083528060051b5f82600281116118455780156112e857905b8060051b61028001518160051b6020880101526001018181186112ca575b50508201602001915050905081019050306103c052610180516103e0525061018061034061010461035c5f855af1611322573d5f5f3e3d5ffd5b60403d10611845576103405161034001600a81511161184557805160208160051b01806104e0828560045afa505050506104e09050600281511061184557600160051b60208201019050516101c052611513565b6060515f610320525f6007905b80600201548318611399576001610320526113a4565b600101818118611383575b50506103205190501561151357600254606051186114615760c0516103405260e051610360523061038052610180516103a0526101a0516103c052610104356103e0525f6104005260605163bc651188610420526103405161044052610360516104605261038051610480526103a0516104a0526103c0516104c0526103e0516104e0526104005161050052602061042060e461043c5f855af161144a573d5f5f3e3d5ffd5b60203d10611845576104209050516101c052611513565b60c0516103405260e051610360526101205161038052306103a052610180516103c0526101a0516103e05261010435610400525f6104205260605163414bf3896104405261034051610460526103605161048052610380516104a0526103a0516104c0526103c0516104e0526103e0516105005261040051610520526104205161054052602061044061010461045c5f855af1611500573d5f5f3e3d5ffd5b60203d10611845576104409050516101c0525b60e05163095ea7b361032052608051610340526101c051610360526020610320604461033c5f855af1611548573d5f5f3e3d5ffd5b60203d1061184557610320518060011c611845576103805261038090505115611845576080515f610320525f6007905b8060020154831861158e57600161032052611599565b600101818118611578575b5050610320519050611697576080516338ed17396103405260a06101c051610360526101243561038052806103a05280610360015f6102c0518083528060051b5f826002811161184557801561160957905b8060051b6102e001518160051b6020880101526001018181186115eb575b50508201602001915050905081019050306103c052610180516103e0525061018061034061010461035c5f855af1611643573d5f5f3e3d5ffd5b60403d10611845576103405161034001600a81511161184557805160208160051b01806104e0828560045afa505050506104e09050600281511061184557600160051b60208201019050516101e052611834565b6080515f610320525f6007905b806002015483186116ba576001610320526116c5565b6001018181186116a4575b50506103205190501561183457600254608051186117825760e0516103405260a051610360523061038052610180516103a0526101c0516103c052610124356103e0525f6104005260805163bc651188610420526103405161044052610360516104605261038051610480526103a0516104a0526103c0516104c0526103e0516104e0526104005161050052602061042060e461043c5f855af161176b573d5f5f3e3d5ffd5b60203d10611845576104209050516101e052611834565b60e0516103405260a051610360526101405161038052306103a052610180516103c0526101c0516103e05261012435610400525f6104205260805163414bf3896104405261034051610460526103605161048052610380516104a0526103a0516104c0526103c0516104e0526103e0516105005261040051610520526104205161054052602061044061010461045c5f855af1611821573d5f5f3e3d5ffd5b60203d10611845576104409050516101e0525b6001610320526020610320f35b5f5ffd5b5f80fd0b4109db184100180cfc082018410a9218418419185b811200a16576797065728300030a0014';

const tokenABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"burnFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"initialSupply","type":"uint256"},{"name":"tokenName","type":"string"},{"name":"tokenSymbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"}];

const sushiswapABI =
[{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];


quickswapABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];


polycatABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

Q3QuoteABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WNativeToken","type":"address"},{"internalType":"address","name":"_poolDeployer","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WNativeToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},{"internalType":"int256","name":"amount1Delta","type":"int256"},{"internalType":"bytes","name":"path","type":"bytes"}],"name":"algebraSwapCallback","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poolDeployer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"uint256","name":"amountIn","type":"uint256"}],"name":"quoteExactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint16[]","name":"fees","type":"uint16[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160","name":"limitSqrtPrice","type":"uint160"}],"name":"quoteExactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint16","name":"fee","type":"uint16"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"quoteExactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint16[]","name":"fees","type":"uint16[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint160","name":"limitSqrtPrice","type":"uint160"}],"name":"quoteExactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint16","name":"fee","type":"uint16"}],"stateMutability":"nonpayable","type":"function"}];

apeswapABI =[{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

const jetswapABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

sushi3ABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH9","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"uint256","name":"amountIn","type":"uint256"}],"name":"quoteExactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint160[]","name":"sqrtPriceX96AfterList","type":"uint160[]"},{"internalType":"uint32[]","name":"initializedTicksCrossedList","type":"uint32[]"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct IQuoterV2.QuoteExactInputSingleParams","name":"params","type":"tuple"}],"name":"quoteExactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceX96After","type":"uint160"},{"internalType":"uint32","name":"initializedTicksCrossed","type":"uint32"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"quoteExactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160[]","name":"sqrtPriceX96AfterList","type":"uint160[]"},{"internalType":"uint32[]","name":"initializedTicksCrossedList","type":"uint32[]"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct IQuoterV2.QuoteExactOutputSingleParams","name":"params","type":"tuple"}],"name":"quoteExactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceX96After","type":"uint160"},{"internalType":"uint32","name":"initializedTicksCrossed","type":"uint32"},{"internalType":"uint256","name":"gasEstimate","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},{"internalType":"int256","name":"amount1Delta","type":"int256"},{"internalType":"bytes","name":"path","type":"bytes"}],"name":"uniswapV3SwapCallback","outputs":[],"stateMutability":"view","type":"function"}];

//KLIMA - Uniswap = WMATIC, Sushiswap = USDC
//AGC = Uniswap = WMATIC, Quickswap = WMATIC
//LINK = Uniswap = WETH, WMATIC, Sushiswap = WETH
// RNDR - Uniswap = WMATIC, WETH S
// DPLY = Quickswap = WMATIC, WBTC

const addressMap = {
  wbtc: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  wmatic: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  link: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
  usdb: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  klima: '0x4e78011ce80ee02d2c3e649fb657e45898257815'
};

const feeMapping = {
  wmatic: BigInt(14000000000000000),
  wbtc: BigInt(5),
  weth: BigInt(1900000000000),
  usdc: BigInt(4900),
  usdt: BigInt(4900),
  usdb: BigInt(4900)
}

const passList = [
  "polycat_finance",
  "apeswap_polygon",
  "dooar-polygon",
  "jetswap",
  "meshswap",
  "honeyswap",
  "sushiswap_polygon_pos",
  "uniswap_v3_polygon_pos",
  "quickswap_v3",
  "sushiswap-v3-polygon",
  "retro",
  "quickswap",
  "dfyn",
  "uniswap-v2-polygon"
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

const wmaticIn = BigInt('10000000000000000000');
const wbtcIn = BigInt('60000');
const usdcIn = BigInt('2500000');
const wethIn = BigInt('8500000000000000');
const daiIn = BigInt('2000000000000000000');
const usdtIn = BigInt('2500000');
const usdbIn = BigInt('2000000');

const wm = BigInt('36000000000000000000');
const wb = BigInt('33000');
const usd = BigInt('16750000');
const weth = BigInt('5600000000000000');
const daiI = BigInt('5000000000000000000');
const ustIn = BigInt('16750000');
const usb = BigInt('16750000')

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
    //console.error('Error fetching Uniswap quote:', error);
    return null;
  }
}

async function getRetro3Quote(tokenIn, tokenOut, amountIn, fee) {

  //Uniswap Quoter Address
  const quoterAddress = '0xddc9Ef56c6bf83F7116Fad5Fbc41272B07ac70C1';

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
    //console.error('Error fetching Uniswap quote:', error);
    return null;
  }
}

// Example function to get a quote
async function getApeswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607';

  // Create a new contract instance using ABI from Interface
  const apeswapContract = new web3.eth.Contract(apeswapABI, routerAddress);

  try {
      try {
        const amountsOut = await apeswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from ApeSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }
}

async function getQS3Quote(tokenIn, tokenOut, amountIn) {
  const routerAddress = '0xa15F0D7377B2A0C0c10db057f641beD21028FC89';
  const routerContract = new web3.eth.Contract(Q3QuoteABI, routerAddress);
  const quote = await routerContract.methods['quoteExactInputSingle'](tokenIn, tokenOut, amountIn, 0).call();
  return quote.amountOut;
}

async function getSS3Quote(tokenIn, tokenOut, amountIn, fee) {
  const routerAddress = '0xb1E835Dc2785b52265711e17fCCb0fd018226a6e';
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

// Example function to get a quote
async function getHoneyswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xaD340d0CD0B117B0140671E7cB39770e7675C848';

  // Create a new contract instance using ABI from Interface
  const routerContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await routerContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from ApeSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }
}

// Example function to get a quote
async function getQuickswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

  // Create a new contract instance using ABI from Interface
  const quickswapContract = new web3.eth.Contract(quickswapABI, routerAddress);

  try {
      try {
        const amountsOut = await quickswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from QuickSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }
}

// Example function to get a quote
async function getSushiswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';

  // Create a new contract instance using ABI from Interface
  const sushiswapContract = new web3.eth.Contract(sushiswapABI, routerAddress);

  try {
      try {
        const amountsOut = await sushiswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from SushiSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getJetswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x5C6EC38fb0e2609672BDf628B1fD605A523E5923';

  // Create a new contract instance using ABI from Interface
  const jetswapContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await jetswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from JetSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getPolycatQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x94930a328162957FF1dd48900aF67B5439336cBD';

  // Create a new contract instance using ABI from Interface
  const polycatContract = new web3.eth.Contract(polycatABI, routerAddress);

  try {
      try {
        const amountsOut = await polycatContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from JetSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getMeshswapQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x10f4a785f458bc144e3706575924889954946639';

  // Create a new contract instance using ABI from Interface
  const meshswapContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await meshswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from MeshSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getRetroQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0x77F0e98e3F2F3134496C2B769f40c891351524d1';

  // Create a new contract instance using ABI from Interface
  const meshswapContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await meshswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from MeshSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getDooarQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xAcc8e414ceeCF0BBF438f6c4B7417Ca59dcF7E47';

  // Create a new contract instance using ABI from Interface
  const meshswapContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await meshswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from MeshSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getBalancerQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xE39B5e3B6D74016b2F6A9673D7d7493B6DF549d5';

  // Create a new contract instance using ABI from Interface
  const meshswapContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await meshswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from MeshSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getDfynQuote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xA102072A4C07F06EC3B4900FDC4C7B80b6c57429';

  // Create a new contract instance using ABI from Interface
  const meshswapContract = new web3.eth.Contract(jetswapABI, routerAddress);

  try {
      try {
        const amountsOut = await meshswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from MeshSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

// Example function to get a quote
async function getUniswap2Quote(amountIn, path) {

  //Quickswap quoter address
  const routerAddress = '0xedf6066a2b290C185783862C7F4776A2C8077AD1';

  // Create a new contract instance using ABI from Interface
  const meshswapContract = new web3.eth.Contract(sushiswapABI, routerAddress);

  try {
      try {
        const amountsOut = await meshswapContract.methods['getAmountsOut'](amountIn, path).call();
        const amountOut = amountsOut[amountsOut.length - 1];
        return amountOut;
      } catch (error) {
        console.error('Error getting quote from MeshSwap:', error);
      }
    return response.amountOut

  } catch (error) {
    //console.error('Error fetching quote:', error);
    return null;
  }

}

async function executeSequence(checkList) {
    //const routerList = name.split("");
      let firstHopAmount;
      let secondHopAmount;
      let thirdHopAmount;

      let routerOne;
      let routerTwo;
      let routerThree;

      let amountIn;
      let revisedAmount;

      console.log("Beginning Maximum Extractable Value Check");

      for (const tradeObj of checkList){

        if (tradeObj.tokens[0] == addressMap.wbtc.toLowerCase()){
          amountIn = wbtcIn;
          revisedAmount = amountIn + feeMapping.wbtc;
        }
        if (tradeObj.tokens[0] == addressMap.usdc.toLowerCase()){
          amountIn = usdcIn;
          revisedAmount = amountIn + feeMapping.usdc;
        }
        if (tradeObj.tokens[0] == addressMap.usdb.toLowerCase()){
          amountIn = usdbIn;
          revisedAmount = amountIn + feeMapping.usdb;
        }
        if (tradeObj.tokens[0] == addressMap.usdt.toLowerCase()){
          amountIn = usdtIn;
          revisedAmount = amountIn + feeMapping.usdt;
        }
        if (tradeObj.tokens[0] == addressMap.weth.toLowerCase()){
          amountIn = wethIn;
          revisedAmount = amountIn + feeMapping.weth;
        }
        if (tradeObj.tokens[0] == addressMap.wmatic.toLowerCase()){
          amountIn = wmaticIn;
          revisedAmount = amountIn + feeMapping.wmatic;
        }

        if (!tradeObj.dexes.every(dex => passList.includes(dex))) {
          console.log("One or more dexes not in available dex list: ", tradeObj.dexes);
          continue;
        }

        if (tradeObj.dexes[0] == "uniswap_v3_polygon_pos"){
          firstHopAmount = await getUniswapQuote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswapSwapRouter;
        }

        else if (tradeObj.dexes[0] == "quickswap_v3"){
          firstHopAmount = await getQS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString());
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = q3Router;
        }

        else if (tradeObj.dexes[0] == "sushiswap-v3-polygon"){
          firstHopAmount = await getSS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = s3Router;
        }
        else if (tradeObj.dexes[0] == "retro"){
          firstHopAmount = await getRetro3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = retro3Router;
        }
        else if (tradeObj.dexes[0] == "quickswap"){
          firstHopAmount = await getQuickswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = quickswapRouter;
        }
        else if (tradeObj.dexes[0] == "jetswap"){
          firstHopAmount = await getJetswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = jetswapRouter;
        }
        else if (tradeObj.dexes[0] == "meshswap"){
          firstHopAmount = await getMeshswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = meshswapRouter;
        }

        else if (tradeObj.dexes[0] == "honeyswap"){
          firstHopAmount = await getHoneyswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = honeyRouter;
        }
        else if (tradeObj.dexes[0] == "sushiswap_polygon_pos"){
          firstHopAmount = await getSushiswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = sushiswapRouter;
        }
        else if (tradeObj.dexes[0] == "polycat_finance"){
          firstHopAmount = await getPolycatQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = polycatRouter;
        }
        else if (tradeObj.dexes[0] == "apeswap_polygon"){
          firstHopAmount = await getApeswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = apeswapRouter;
        }
        else if (tradeObj.dexes[0] == "dooar-polygon"){
          firstHopAmount = await getDooarQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dooarRouter;
        }
        else if (tradeObj.dexes[0] == "uniswap-v2-polygon"){
          firstHopAmount = await getUniswap2Quote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap2Router;
        }
        else if (tradeObj.dexes[0] == "dfyn'"){
          firstHopAmount = await getDfynQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dfynRouter;
        }


        if (tradeObj.dexes[1] == "uniswap_v3_polygon_pos"){
          secondHopAmount = await getUniswapQuote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[1] == "quickswap_v3"){
          secondHopAmount = await getQS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString());
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = q3Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap-v3-polygon"){
          secondHopAmount = await getSS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = s3Router;
        }
        else if (tradeObj.dexes[1] == "retro"){
          secondHopAmount = await getRetro3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = retro3Router;
        }
        else if (tradeObj.dexes[1] == "quickswap"){
          secondHopAmount = await getQuickswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = quickswapRouter;
        }
        else if (tradeObj.dexes[1] == "jetswap"){
          secondHopAmount = await getJetswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = jetswapRouter;
        }
        else if (tradeObj.dexes[1] == "meshswap"){
          secondHopAmount = await getMeshswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = meshswapRouter;
        }
        else if (tradeObj.dexes[1] == "honeyswap"){
          secondHopAmount = await getHoneyswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = honeyRouter;
        }
        else if (tradeObj.dexes[1] == "sushiswap_polygon_pos"){
          secondHopAmount = await getSushiswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = sushiswapRouter;
        }
        else if (tradeObj.dexes[1] == "polycat_finance"){
          secondHopAmount = await getPolycatQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = polycatRouter;
        }
        else if (tradeObj.dexes[1] == "apeswap"){
          secondHopAmount = await getApeswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = apeswapRouter;
        }
        else if (tradeObj.dexes[1] == "dooar-polygon"){
          secondHopAmount = await getDooarQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dooarRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap-v2-polygon"){
          secondHopAmount = await getUniswap2Quote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap2Router;
        }
        else if (tradeObj.dexes[1] == "dfyn"){
          secondHopAmount = await getDfynQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dfynRouter;
        }

        if (tradeObj.dexes[2] == "uniswap_v3_polygon_pos"){
          thirdHopAmount = await getUniswapQuote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString(), tradeObj.fees[2]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[2] == "quickswap_v3"){
          thirdHopAmount = await getQS3Quote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString());
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = q3Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap-v3-polygon"){
          thirdHopAmount = await getSS3Quote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString(), tradeObj.fees[2]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = s3Router;
        }
        else if (tradeObj.dexes[2] == "retro"){
          thirdHopAmount = await getRetro3Quote(tradeObj.tokens[2], tradeObj.tokens[0], secondHopAmount.toString(), tradeObj.fees[2]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = retro3Router;
        }
        else if (tradeObj.dexes[2] == "quickswap"){
          thirdHopAmount = await getQuickswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = quickswapRouter;
        }
        else if (tradeObj.dexes[2] == "jetswap"){
          thirdHopAmount = await getJetswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = jetswapRouter;
        }
        else if (tradeObj.dexes[2] == "meshswap"){
          thirdHopAmount = await getMeshswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = meshswapRouter;
        }
        else if (tradeObj.dexes[2] == "honeyswap"){
          thirdHopAmount = await getHoneyswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = honeyRouter;
        }
        else if (tradeObj.dexes[2] == "sushiswap_polygon_pos"){
          thirdHopAmount = await getSushiswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = sushiswapRouter;
        }
        else if (tradeObj.dexes[2] == "polycat_finance"){
          thirdHopAmount = await getPolycatQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = polycatRouter;
        }
        else if (tradeObj.dexes[2] == "apeswap"){
          thirdHopAmount = await getApeswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = apeswapRouter;
        }
        else if (tradeObj.dexes[2] == "dooar-polygon"){
          thirdHopAmount = await getDooarQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dooarRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap-v2-polygon"){
          thirdHopAmount = await getUniswap2Quote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap2Router;
        }
        else if (tradeObj.dexes[2] == "dfyn"){
          thirdHopAmount = await getDfynQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[0]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dfynRouter;
        }

        if (revisedAmount < thirdHopAmount){

          try{
            console.log('Success \nSequence: ', tradeObj.tokens);
            console.log(`Winning Total: ${thirdHopAmount}`);
            console.log("FEES: ", tradeObj.fees);
            console.log("Dexs: ", tradeObj.dexes);
            console.log("Preparing Swaps...")

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
      let seventhHopAmount;
      let eighthHopAmount;

      let routerOne;
      let routerTwo;
      let routerThree;
      let routerFour;
      let routerFive;
      let routerSix;
      let routerSeven;
      let routerEight;

      let amountIn;
      let revisedAmount;

      console.log("Beginning Maximum Extractable Value Check");

      for (const tradeObj of checkList){

        if (tradeObj.tokens[0] == addressMap.wbtc.toLowerCase()){
          amountIn = wbtcIn;
          revisedAmount = amountIn + feeMapping.wbtc;
        }
        if (tradeObj.tokens[0] == addressMap.usdc.toLowerCase()){
          amountIn = usdcIn;
          revisedAmount = amountIn + feeMapping.usdc;
        }
        if (tradeObj.tokens[0] == addressMap.usdb.toLowerCase()){
          amountIn = usdbIn;
          revisedAmount = amountIn + feeMapping.usdb;
        }
        if (tradeObj.tokens[0] == addressMap.usdt.toLowerCase()){
          amountIn = usdtIn;
          revisedAmount = amountIn + feeMapping.usdt;
        }
        if (tradeObj.tokens[0] == addressMap.weth.toLowerCase()){
          amountIn = wethIn;
          revisedAmount = amountIn + feeMapping.weth;
        }
        if (tradeObj.tokens[0] == addressMap.wmatic.toLowerCase()){
          amountIn = wmaticIn;
          revisedAmount = amountIn + feeMapping.wmatic;
        }

        if (!tradeObj.dexes.every(dex => passList.includes(dex))) {
          console.log("One or more dexes not in available dex list: ", tradeObj.dexes);
          continue;
        }

        if (tradeObj.dexes[0] == "uniswap_v3_polygon_pos"){
          firstHopAmount = await getUniswapQuote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswapSwapRouter;
        }

        else if (tradeObj.dexes[0] == "quickswap_v3"){
          firstHopAmount = await getQS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString());
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = q3Router;
        }

        else if (tradeObj.dexes[0] == "sushiswap-v3-polygon"){
          firstHopAmount = await getSS3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = s3Router;
        }
        else if (tradeObj.dexes[0] == "retro"){
          firstHopAmount = await getRetro3Quote(tradeObj.tokens[0], tradeObj.tokens[1], amountIn.toString(), tradeObj.fees[0]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = retro3Router;
        }
        else if (tradeObj.dexes[0] == "quickswap"){
          firstHopAmount = await getQuickswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = quickswapRouter;
        }
        else if (tradeObj.dexes[0] == "jetswap"){
          firstHopAmount = await getJetswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = jetswapRouter;
        }
        else if (tradeObj.dexes[0] == "meshswap"){
          firstHopAmount = await getMeshswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = meshswapRouter;
        }

        else if (tradeObj.dexes[0] == "honeyswap"){
          firstHopAmount = await getHoneyswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = honeyRouter;
        }
        else if (tradeObj.dexes[0] == "sushiswap_polygon_pos"){
          firstHopAmount = await getSushiswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = sushiswapRouter;
        }
        else if (tradeObj.dexes[0] == "polycat_finance"){
          firstHopAmount = await getPolycatQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = polycatRouter;
        }
        else if (tradeObj.dexes[0] == "apeswap_polygon"){
          firstHopAmount = await getApeswapQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = apeswapRouter;
        }
        else if (tradeObj.dexes[0] == "dooar-polygon"){
          firstHopAmount = await getDooarQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dooarRouter;
        }
        else if (tradeObj.dexes[0] == "uniswap-v2-polygon"){
          firstHopAmount = await getUniswap2Quote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = uniswap2Router;
        }
        else if (tradeObj.dexes[0] == "dfyn'"){
          firstHopAmount = await getDfynQuote(amountIn.toString(), [tradeObj.tokens[0], tradeObj.tokens[1]]);
          if (!firstHopAmount) {
            console.error('Failed to get the first hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerOne = dfynRouter;
        }


        if (tradeObj.dexes[1] == "uniswap_v3_polygon_pos"){
          secondHopAmount = await getUniswapQuote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[1] == "quickswap_v3"){
          secondHopAmount = await getQS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString());
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = q3Router;
        }
        else if (tradeObj.dexes[1] == "sushiswap-v3-polygon"){
          secondHopAmount = await getSS3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = s3Router;
        }
        else if (tradeObj.dexes[1] == "retro"){
          secondHopAmount = await getRetro3Quote(tradeObj.tokens[1], tradeObj.tokens[2], firstHopAmount.toString(), tradeObj.fees[1]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = retro3Router;
        }
        else if (tradeObj.dexes[1] == "quickswap"){
          secondHopAmount = await getQuickswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = quickswapRouter;
        }
        else if (tradeObj.dexes[1] == "jetswap"){
          secondHopAmount = await getJetswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = jetswapRouter;
        }
        else if (tradeObj.dexes[1] == "meshswap"){
          secondHopAmount = await getMeshswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = meshswapRouter;
        }
        else if (tradeObj.dexes[1] == "honeyswap"){
          secondHopAmount = await getHoneyswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = honeyRouter;
        }
        else if (tradeObj.dexes[1] == "sushiswap_polygon_pos"){
          secondHopAmount = await getSushiswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = sushiswapRouter;
        }
        else if (tradeObj.dexes[1] == "polycat_finance"){
          secondHopAmount = await getPolycatQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = polycatRouter;
        }
        else if (tradeObj.dexes[1] == "apeswap"){
          secondHopAmount = await getApeswapQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = apeswapRouter;
        }
        else if (tradeObj.dexes[1] == "dooar-polygon"){
          secondHopAmount = await getDooarQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dooarRouter;
        }
        else if (tradeObj.dexes[1] == "uniswap-v2-polygon"){
          secondHopAmount = await getUniswap2Quote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = uniswap2Router;
        }
        else if (tradeObj.dexes[1] == "dfyn"){
          secondHopAmount = await getDfynQuote(firstHopAmount.toString(), [tradeObj.tokens[1], tradeObj.tokens[2]]);
          if (!secondHopAmount) {
            console.error('Failed to get the second hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerTwo = dfynRouter;
        }


        if (tradeObj.dexes[2] == "uniswap_v3_polygon_pos"){
          thirdHopAmount = await getUniswapQuote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[2] == "quickswap_v3"){
          thirdHopAmount = await getQS3Quote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString());
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = q3Router;
        }
        else if (tradeObj.dexes[2] == "sushiswap-v3-polygon"){
          thirdHopAmount = await getSS3Quote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = s3Router;
        }
        else if (tradeObj.dexes[2] == "retro"){
          thirdHopAmount = await getRetro3Quote(tradeObj.tokens[2], tradeObj.tokens[3], secondHopAmount.toString(), tradeObj.fees[2]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = retro3Router;
        }
        else if (tradeObj.dexes[2] == "quickswap"){
          thirdHopAmount = await getQuickswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = quickswapRouter;
        }
        else if (tradeObj.dexes[2] == "jetswap"){
          thirdHopAmount = await getJetswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = jetswapRouter;
        }
        else if (tradeObj.dexes[2] == "meshswap"){
          thirdHopAmount = await getMeshswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = meshswapRouter;
        }
        else if (tradeObj.dexes[2] == "honeyswap"){
          thirdHopAmount = await getHoneyswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = honeyRouter;
        }
        else if (tradeObj.dexes[2] == "sushiswap_polygon_pos"){
          thirdHopAmount = await getSushiswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = sushiswapRouter;
        }
        else if (tradeObj.dexes[2] == "polycat_finance"){
          thirdHopAmount = await getPolycatQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = polycatRouter;
        }
        else if (tradeObj.dexes[2] == "apeswap"){
          thirdHopAmount = await getApeswapQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = apeswapRouter;
        }
        else if (tradeObj.dexes[2] == "dooar-polygon"){
          thirdHopAmount = await getDooarQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dooarRouter;
        }
        else if (tradeObj.dexes[2] == "uniswap-v2-polygon"){
          thirdHopAmount = await getUniswap2Quote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = uniswap2Router;
        }
        else if (tradeObj.dexes[2] == "dfyn"){
          thirdHopAmount = await getDfynQuote(secondHopAmount.toString(), [tradeObj.tokens[2], tradeObj.tokens[3]]);
          if (!thirdHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerThree = dfynRouter;
        }


        if (tradeObj.dexes[3] == "uniswap_v3_polygon_pos"){
          fourthHopAmount = await getUniswapQuote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[3] == "quickswap_v3"){
          fourthHopAmount = await getQS3Quote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString());
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = q3Router;
        }
        else if (tradeObj.dexes[3] == "sushiswap-v3-polygon"){
          fourthHopAmount = await getSS3Quote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = s3Router;
        }
        else if (tradeObj.dexes[3] == "retro"){
          fourthHopAmount = await getRetro3Quote(tradeObj.tokens[3], tradeObj.tokens[4], thirdHopAmount.toString(), tradeObj.fees[3]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = retro3Router;
        }
        else if (tradeObj.dexes[3] == "quickswap"){
          fourthHopAmount = await getQuickswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = quickswapRouter;
        }
        else if (tradeObj.dexes[3] == "jetswap"){
          fourthHopAmount = await getJetswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = jetswapRouter;
        }
        else if (tradeObj.dexes[3] == "meshswap"){
          fourthHopAmount = await getMeshswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = meshswapRouter;
        }
        else if (tradeObj.dexes[3] == "honeyswap"){
          fourthHopAmount = await getHoneyswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = honeyRouter;
        }
        else if (tradeObj.dexes[3] == "sushiswap_polygon_pos"){
          fourthHopAmount = await getSushiswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = sushiswapRouter;
        }
        else if (tradeObj.dexes[3] == "polycat_finance"){
          fourthHopAmount = await getPolycatQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = polycatRouter;
        }
        else if (tradeObj.dexes[3] == "apeswap"){
          fourthHopAmount = await getApeswapQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = apeswapRouter;
        }
        else if (tradeObj.dexes[3] == "dooar-polygon"){
          fourthHopAmount = await getDooarQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = dooarRouter;
        }
        else if (tradeObj.dexes[3] == "uniswap-v2-polygon"){
          fourthHopAmount = await getUniswap2Quote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = uniswap2Router;
        }
        else if (tradeObj.dexes[3] == "dfyn"){
          fourthHopAmount = await getDfynQuote(thirdHopAmount.toString(), [tradeObj.tokens[3], tradeObj.tokens[4]]);
          if (!fourthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFour = dfynRouter;
        }


        if (tradeObj.dexes[4] == "uniswap_v3_polygon_pos"){
          fifthHopAmount = await getUniswapQuote(tradeObj.tokens[4], tradeObj.tokens[5], fourthHopAmount.toString(), tradeObj.fees[4]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[4] == "quickswap_v3"){
          fifthHopAmount = await getQS3Quote(tradeObj.tokens[4], tradeObj.tokens[5], fourthHopAmount.toString());
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = q3Router;
        }
        else if (tradeObj.dexes[4] == "sushiswap-v3-polygon"){
          fifthHopAmount = await getSS3Quote(tradeObj.tokens[4], tradeObj.tokens[5], fourthHopAmount.toString(), tradeObj.fees[4]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = s3Router;
        }
        else if (tradeObj.dexes[4] == "retro"){
          fifthHopAmount = await getRetro3Quote(tradeObj.tokens[4], tradeObj.tokens[5], fourthHopAmount.toString(), tradeObj.fees[4]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = retro3Router;
        }
        else if (tradeObj.dexes[4] == "quickswap"){
          fifthHopAmount = await getQuickswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = quickswapRouter;
        }
        else if (tradeObj.dexes[4] == "jetswap"){
          fifthHopAmount = await getJetswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = jetswapRouter;
        }
        else if (tradeObj.dexes[4] == "meshswap"){
          fifthHopAmount = await getMeshswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = meshswapRouter;
        }
        else if (tradeObj.dexes[4] == "honeyswap"){
          fifthHopAmount = await getHoneyswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = honeyRouter;
        }
        else if (tradeObj.dexes[4] == "sushiswap_polygon_pos"){
          fifthHopAmount = await getSushiswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = sushiswapRouter;
        }
        else if (tradeObj.dexes[4] == "polycat_finance"){
          fifthHopAmount = await getPolycatQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = polycatRouter;
        }
        else if (tradeObj.dexes[4] == "apeswap"){
          fifthHopAmount = await getApeswapQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = apeswapRouter;
        }
        else if (tradeObj.dexes[4] == "dooar-polygon"){
          fifthHopAmount = await getDooarQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = dooarRouter;
        }
        else if (tradeObj.dexes[4] == "uniswap-v2-polygon"){
          fifthHopAmount = await getUniswap2Quote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = uniswap2Router;
        }
        else if (tradeObj.dexes[4] == "dfyn"){
          fifthHopAmount = await getDfynQuote(fourthHopAmount.toString(), [tradeObj.tokens[4], tradeObj.tokens[5]]);
          if (!fifthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerFive = dfynRouter;
        }


        if (tradeObj.dexes[5] == "uniswap_v3_polygon_pos"){
          sixthHopAmount = await getUniswapQuote(tradeObj.tokens[5], tradeObj.tokens[0], fifthHopAmount.toString(), tradeObj.fees[5]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = uniswapSwapRouter;
        }
        else if (tradeObj.dexes[5] == "quickswap_v3"){
          sixthHopAmount = await getQS3Quote(tradeObj.tokens[5], tradeObj.tokens[0], fifthHopAmount.toString());
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = q3Router;
        }
        else if (tradeObj.dexes[5] == "sushiswap-v3-polygon"){
          sixthHopAmount = await getSS3Quote(tradeObj.tokens[5], tradeObj.tokens[0], fifthHopAmount.toString(), tradeObj.fees[5]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = s3Router;
        }
        else if (tradeObj.dexes[5] == "retro"){
          sixthHopAmount = await getRetro3Quote(tradeObj.tokens[5], tradeObj.tokens[0], fifthHopAmount.toString(), tradeObj.fees[5]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = retro3Router;
        }
        else if (tradeObj.dexes[5] == "quickswap"){
          sixthHopAmount = await getQuickswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = quickswapRouter;
        }
        else if (tradeObj.dexes[5] == "jetswap"){
          sixthHopAmount = await getJetswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = jetswapRouter;
        }
        else if (tradeObj.dexes[5] == "meshswap"){
          sixthHopAmount = await getMeshswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = meshswapRouter;
        }
        else if (tradeObj.dexes[5] == "honeyswap"){
          sixthHopAmount = await getHoneyswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = honeyRouter;
        }
        else if (tradeObj.dexes[5] == "sushiswap_polygon_pos"){
          sixthHopAmount = await getSushiswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = sushiswapRouter;
        }
        else if (tradeObj.dexes[5] == "polycat_finance"){
          sixthHopAmount = await getPolycatQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = polycatRouter;
        }
        else if (tradeObj.dexes[5] == "apeswap"){
          sixthHopAmount = await getApeswapQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = apeswapRouter;
        }
        else if (tradeObj.dexes[5] == "dooar-polygon"){
          sixthHopAmount = await getDooarQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = dooarRouter;
        }
        else if (tradeObj.dexes[5] == "uniswap-v2-polygon"){
          sixthHopAmount = await getUniswap2Quote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = uniswap2Router;
        }
        else if (tradeObj.dexes[5] == "dfyn"){
          sixthHopAmount = await getDfynQuote(fifthHopAmount.toString(), [tradeObj.tokens[5], tradeObj.tokens[0]]);
          if (!sixthHopAmount) {
            console.error('Failed to get the third hop amount', tradeObj);
            continue; // Skip to the next iteration if the quote fails
          }
          routerSix = dfynRouter;
        }

        if (revisedAmount < sixthHopAmount){

          try{
            console.log('Success \nSequence: ', tradeObj.tokens);
            console.log(`Winning Total: ${sixthHopAmount}`);
            console.log("FEES: ", tradeObj.fees);
            console.log("Dexs: ", tradeObj.dexes);
            //console.log("Preparing Swaps...")

            //Access MEV smart contract for swappoing
            //const swapContract = await new web3.eth.Contract(mevABI, mevBotAddress);

            //Acquire Account via PK
            //const account = web3.eth.accounts.privateKeyToAccount(signature);

            //Get account nonce
            //const nonce = await web3.eth.getTransactionCount(account.address);

            //Build Swap Transaction and Encode
            /*
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

            console.log("Transaction Hash: ", receipt.transactionHash);
            */

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
        await delay(650); // Delay to ensure rate limits are respected
      }
      console.log("MEV Process Complete");
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function CheckAndTrade(){

  const addressMap = ['0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359']
  let poolData;
  poolData = await fetchAllTrendingPools();
  let executedSeq = true;

  const swaps = generateSwapPaths(poolData.data, addressMap);

  await executeSixSequence(swaps[6]);

  /*
  while(executedSeq){

    // Update pool data with addressMap comparison
    const triangularTrades = findTriangularTrades(poolData.data, addressMap);

    await executesixSequence(triangularTrades);
  }
  */

  console.log("Maximum Extractable Value Process Complete.")

}

// Run the function immediately
CheckAndTrade();
