// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BasedDoomS1} from "../src/BasedDoomS1.sol";

interface Vm {
    function envOr(string calldata name, uint256 defaultValue) external returns (uint256);
    function envString(string calldata name) external returns (string memory);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployBasedDoomS1 {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    error MissingDeployerPrivateKey();

    event BasedDoomS1Deployed(address indexed deployedAddress, string tokenUri);

    function run() external returns (BasedDoomS1 deployed) {
        uint256 privateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));

        if (privateKey == 0) {
            privateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        }

        if (privateKey == 0) {
            revert MissingDeployerPrivateKey();
        }

        string memory tokenUri = vm.envString("BASED_DOOM_S1_TOKEN_URI");

        vm.startBroadcast(privateKey);
        deployed = new BasedDoomS1(tokenUri);
        vm.stopBroadcast();

        emit BasedDoomS1Deployed(address(deployed), tokenUri);
    }
}
