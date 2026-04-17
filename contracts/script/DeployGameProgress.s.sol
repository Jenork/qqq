// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {GameProgress} from "../src/GameProgress.sol";

interface Vm {
    function envUint(string calldata name) external returns (uint256);
    function envOr(string calldata name, uint256 defaultValue) external returns (uint256);
    function envAddress(string calldata name) external returns (address);
    function envOr(string calldata name, address defaultValue) external returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployGameProgress {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 private constant SHOTGUN_PRICE = 300000;

    error MissingDeployerPrivateKey();
    error MissingUsdcToken();
    error MissingUsdcRecipient();

    event GameProgressDeployed(
        address indexed deployedAddress,
        address indexed usdcToken,
        address indexed usdcRecipient,
        uint256 shotgunPrice
    );

    function run() external returns (GameProgress deployed) {
        uint256 privateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));
        address usdcToken = vm.envOr("NEXT_PUBLIC_USDC_TOKEN_ADDRESS", address(0));
        address recipient = vm.envOr("NEXT_PUBLIC_USDC_RECIPIENT", address(0));

        if (privateKey == 0) {
            privateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        }

        if (usdcToken == address(0)) {
            usdcToken = vm.envOr("USDC_TOKEN_ADDRESS", address(0));
        }

        if (recipient == address(0)) {
            recipient = vm.envOr("USDC_RECIPIENT", address(0));
        }

        if (privateKey == 0) {
            revert MissingDeployerPrivateKey();
        }

        if (usdcToken == address(0)) {
            revert MissingUsdcToken();
        }

        if (recipient == address(0)) {
            revert MissingUsdcRecipient();
        }

        vm.startBroadcast(privateKey);
        deployed = new GameProgress(usdcToken, recipient, SHOTGUN_PRICE);
        vm.stopBroadcast();

        emit GameProgressDeployed(address(deployed), usdcToken, recipient, SHOTGUN_PRICE);
    }
}
