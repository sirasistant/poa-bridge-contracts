pragma solidity ^0.4.19;


import "../../contracts/upgradeable_contracts/U_ForeignBridge.sol";


interface OwnableToken {
    function transferOwnership(address) external;
}

contract ForeignBridgeV2 is ForeignBridge {
    function changeTokenOwnership(address _newTokenOwner) public onlyOwner {
    }
}
