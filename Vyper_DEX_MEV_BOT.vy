
from vyper.interfaces import ERC20
from vyper.interfaces import ERC20Detailed

#Basic variables
owner: address
zero: address

#Storage Router Address Variables
v3: public(address[7])

# Vyper Interface for a Uniswap v2 DEX (or like)
interface SwapRouterV2:
  def swapExactTokensForTokens(
    amountIn: uint256,
    amountOutMin: uint256,
    path: DynArray[address, 10],
    to: address,
    deadline: uint256
  ) -> DynArray[uint256, 10]: nonpayable

# Struct for the parameters used in the exactInputSingle function
struct ExactInputSingleParams:
    tokenIn: address
    tokenOut: address
    fee: uint24
    recipient: address
    deadline: uint256
    amountIn: uint256
    amountOutMinimum: uint256
    sqrtPriceLimitX96: uint160

# Struct for exactInput (multi-hop)
struct ExactInputParams:
    path: Bytes[102]
    recipient: address
    deadline: uint256
    amountIn: uint256
    amountOutMinimum: uint256

struct ExactInputSingleParamsQ:
    tokenIn: address
    tokenOut: address
    recipient: address
    deadline: uint256
    amountIn: uint256
    amountOutMinimum: uint256
    limitSqrtPrice: uint160

#Vyper Interface for UniswapV3
interface SwapRouterV3:
  def exactInputSingle(params: ExactInputSingleParams) -> uint256: payable
  def exactInput(params: ExactInputParams) -> uint256: payable

interface QuickswapRouterV3:
  def exactInputSingle(params: ExactInputSingleParamsQ) -> uint256: payable

  # Correct interface with proper types
interface SwapRouterV4:
  def execute(commands: Bytes[256], inputs: DynArray[Bytes[256], 256], deadline: uint256) -> uint256: payable

@external
def __init__():
  self.owner = msg.sender
  self.zero = 0x0000000000000000000000000000000000000000

  self.v3[0] = 0x2E6cd2d30aa43f40aa81619ff4b6E0a41479B13F
  self.v3[1] = 0xE592427A0AEce92De3Edee1F18E0157C05861564
  self.v3[2] = 0x1b81D678ffb9C0263b24A97847620C99d213eB14
  self.v3[3] = 0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af
  self.v3[4] = empty(address)
  self.v3[5] = empty(address)
  self.v3[6] = empty(address)

@external
def DepositToken(_amount: uint256, _token: address) -> bool:

  #Get user balance
  userBalance: uint256 = ERC20(_token).balanceOf(msg.sender)

  #Cancel if user does not possess funds for transfer
  assert userBalance == _amount or userBalance > _amount, "Not enough token in wallet to proceed."

  #Perform transfer from predefinded allowance (Set by user)
  userTransfer: bool = ERC20(_token).transferFrom(msg.sender, self, _amount)

  assert userTransfer, "Transfer was unsuccessful"

  return True

@internal
def encode_path(
    token_in: address,
    fee: uint24,
    token_out: address
) -> Bytes[43]:  # 20 (tokenIn) + 3 (fee) + 20 (tokenOut)

    # Convert fee to 3 bytes
    fee_bytes: Bytes[3] = slice(convert(fee, bytes32), 29, 3)

    # Convert token_in and token_out into byte slices
    token_in_bytes: Bytes[20] = slice(convert(token_in, bytes32), 12, 20)
    token_out_bytes: Bytes[20] = slice(convert(token_out, bytes32), 12, 20)

    # Correct use of concat
    path: Bytes[43] = concat(token_in_bytes, fee_bytes, token_out_bytes)

    return path

@external
def changeV3Address(_token: address, _listSpace: uint24) -> bool:
  assert msg.sender == self.owner, "Only owner can recover tokens"
  self.v3[_listSpace] = _token
  return True

@payable
@external
def DepositNative(_amount: uint256) -> bool:
  return True

# Returns to the contract holder the ether accumulated in the result of the arbitration contract operation
@external
def recover() -> bool:
  assert msg.sender == self.owner, "Only owner can recover tokens"
  send(msg.sender, self.balance)
  return True

@external
def recoverTokens(tokenAddress: address, _withdraw: uint256) -> bool:

  assert msg.sender == self.owner, "Only the owner can recover tokens"

  _token : ERC20 = ERC20(tokenAddress)
  _amount : uint256 = _token.balanceOf(self)

  assert _amount > _withdraw or _amount == _withdraw, "Not enough funds in contract."

  _token.transfer(msg.sender, _withdraw)

  return True

@external
def TriDexSwap(
                _route1: address,
                _route2: address,
                _route3: address,
                _token1: address,
                _token2: address,
                _token3: address,
                _amount: uint256,
                _outMin1: uint256,
                _outMin2: uint256,
                _outMin3: uint256,
                _fee1: uint24,
                _fee2: uint24,
                _fee3: uint24) -> bool:

  assert msg.sender == self.owner, "Only the owner can call this function"

  tokenOneApproval: bool = ERC20(_token1).approve(_route1, _amount)
  assert tokenOneApproval, "Token not approved for spending."

  _deadline: uint256 = block.timestamp + 30

  _firstHop: uint256 = 0
  _secondHop: uint256 = 0
  _thirdHop: uint256 = 0

  _path1: DynArray[address, 2] = [_token1, _token2]
  _path2: DynArray[address, 2] = [_token2, _token3]
  _path3: DynArray[address, 2] = [_token3, _token1]

  if not(_route1 in self.v3):

    _firstHop = SwapRouterV2(_route1).swapExactTokensForTokens(
      _amount,
      _outMin1,
      _path1,
      self,
      _deadline
      )[1]

  elif(_route1 in self.v3):

    if (_route1 == self.v3[0]):

      params1 : ExactInputSingleParamsQ = ExactInputSingleParamsQ({
         tokenIn: _token1,
         tokenOut: _token2,
         recipient: self,
         deadline: _deadline,
         amountIn: _amount,
         amountOutMinimum: _outMin1,
         limitSqrtPrice: 0
      })

      _firstHop = QuickswapRouterV3(_route1).exactInputSingle(params1)

    elif (_route1 == self.v3[3]):
      # Encode the path
      path1: Bytes[69] = self.encode_path(_token1, _fee1, _token2)

      # Encode commands: V4_SWAP (0x04)
      commands1: Bytes[1] = b"\x04"

      # Encode inputs (path + amountIn + recipient)
      inputs1: DynArray[Bytes[256], 256] = [
          path1,
          slice(convert(_amount, bytes32), 0, 32),  # Convert uint256 to bytes
          slice(convert(_outMin1, bytes32), 0, 32),  # Convert min amountOut to bytes
          slice(convert(self, bytes32), 12, 20)  # Convert recipient address
      ]

      # Execute the swap via SwapRouterV4
      _firstHop = SwapRouterV4(_route1).execute(commands1, inputs1, _deadline)

    else:

      params1 : ExactInputSingleParams = ExactInputSingleParams({
         tokenIn: _token1,
         tokenOut: _token2,
         fee: _fee1,
         recipient: self,
         deadline: _deadline,
         amountIn: _amount,
         amountOutMinimum: _outMin1,
         sqrtPriceLimitX96: 0
      })

      _firstHop = SwapRouterV3(_route1).exactInputSingle(params1)

  assert ERC20(_token2).approve(_route2, _firstHop)

  if not (_route2 in self.v3):
    _secondHop = SwapRouterV2(_route2).swapExactTokensForTokens(
      _firstHop,
      _outMin2,
      _path2,
      self,
      _deadline
      )[1]

  elif (_route2 in self.v3):

    if (_route2 == self.v3[0]):

      params2 : ExactInputSingleParamsQ = ExactInputSingleParamsQ({
         tokenIn: _token2,
         tokenOut: _token3,
         recipient: self,
         deadline: _deadline,
         amountIn: _firstHop,
         amountOutMinimum: _outMin2,
         limitSqrtPrice: 0
      })

      _secondHop = QuickswapRouterV3(_route2).exactInputSingle(params2)

    elif (_route2 == self.v3[3]):
      # Encode the path
      path2: Bytes[69] = self.encode_path(_token2, _fee2, _token3)

      # Encode commands: V4_SWAP (0x04)
      commands2: Bytes[1] = b"\x04"

      # Encode inputs (path + amountIn + recipient)
      inputs2: DynArray[Bytes[256], 256] = [
          path2,
          slice(convert(_firstHop, bytes32), 0, 32),  # Convert amountIn to bytes correctly
          slice(convert(_outMin2, bytes32), 0, 32),  # Convert min amountOut to bytes correctly
          slice(convert(self, bytes32), 12, 20)  # Convert recipient address correctly
      ]

      # Execute the swap via SwapRouterV4
      _secondHop = SwapRouterV4(_route2).execute(commands2, inputs2, _deadline)

    else:

      params2 : ExactInputSingleParams = ExactInputSingleParams({
         tokenIn: _token2,
         tokenOut: _token3,
         fee: _fee2,
         recipient: self,
         deadline: _deadline,
         amountIn: _firstHop,
         amountOutMinimum: _outMin2,
         sqrtPriceLimitX96: 0
      })

      _secondHop = SwapRouterV3(_route2).exactInputSingle(params2)

  assert ERC20(_token3).approve(_route3, _secondHop)

  if not (_route3 in self.v3):
    _thirdHop = SwapRouterV2(_route3).swapExactTokensForTokens(
      _secondHop,
      _outMin3,
      _path3,
      self,
      _deadline
    )[1]

  elif (_route3 in self.v3):

    if (_route3 == self.v3[0]):

      params3 : ExactInputSingleParamsQ = ExactInputSingleParamsQ({
         tokenIn: _token3,
         tokenOut: _token1,
         recipient: self,
         deadline: _deadline,
         amountIn: _secondHop,
         amountOutMinimum: _outMin3,
         limitSqrtPrice: 0
      })

      _thirdHop = QuickswapRouterV3(_route3).exactInputSingle(params3)

    elif (_route3 == self.v3[3]):
      # Encode the path
      path3: Bytes[69] = self.encode_path(_token3, _fee3, _token1)

      # Encode commands: V4_SWAP (0x04)
      commands3: Bytes[1] = b"\x04"

      # Encode inputs (path + amountIn + recipient)
      inputs3: DynArray[Bytes[256], 256] = [
          path3,
          slice(convert(_secondHop, bytes32), 0, 32),  # Convert amountIn to bytes correctly
          slice(convert(_outMin3, bytes32), 0, 32),  # Convert min amountOut to bytes correctly
          slice(convert(self, bytes32), 12, 20)  # Convert recipient address correctly
      ]

      # Execute the swap via SwapRouterV4
      _thirdHop = SwapRouterV4(_route2).execute(commands3, inputs3, _deadline)

    else:

      # Third swap: _token3 -> _token1 using exactInputSingle
      params3: ExactInputSingleParams = ExactInputSingleParams({
         tokenIn: _token3,
         tokenOut: _token1,
         fee: _fee3,
         recipient: self,
         deadline: _deadline,
         amountIn: _secondHop,
         amountOutMinimum: _outMin3,
         sqrtPriceLimitX96: 0
      })

      _thirdHop = SwapRouterV3(_route3).exactInputSingle(params3)

  return True
