// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";

interface IPool{
    function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params) external;
}

contract FlashloanReceiver {
    address public owner;
    IPool public pool;

    constructor(address _pool){
        owner = msg.sender;
        pool = IPool(_pool);
    }

    // Called by bot via execute Flashloan
    function initFlashloan(address token, uint256 amount, bytes calldata params) external {
        // Initiate Aave V3 flashloan
        pool.flashLoanSimple(address(this), token, amount, params);
    }

    // Aave flashloan callback
    // NOTE: method signature depends on Aave V3 implementation. Replace with correct callback in production.
    function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bool){
        // Implement swap logic here by calling DEX routers using params

        // After swaps, ensure repayment to pool
        uint256 totalOwed = amount + premium;
        IERC20(asset).approve(address(pool), totalOwed);
        return true;
    }

    // Emergency withdraw
    function withdraw(address token, uint256 amount) external {
        require(msg.sender == owner, "only owner");
        IERC20(token).transfer(owner, amount);
    }
}
