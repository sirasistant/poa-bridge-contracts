pragma solidity ^0.4.19;


import "../../contracts/upgradeable_contracts/U_ForeignBridge.sol";


interface OwnableToken {
    function transferOwnership(address) external;
}

contract ForeignBridgeV2 is ForeignBridge {
    address public something;
    function doSomething(address _newTokenOwner) public onlyOwner {
        something = _newTokenOwner;
    }
}
