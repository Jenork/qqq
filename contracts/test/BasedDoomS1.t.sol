// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BasedDoomS1} from "../src/BasedDoomS1.sol";

interface Vm {
    function expectRevert() external;
    function expectRevert(bytes calldata revertData) external;
    function prank(address sender) external;
}

contract BasedDoomS1Test {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    string private constant TOKEN_URI = "ipfs://based-doom-s1-metadata";

    BasedDoomS1 private badge;

    function setUp() public {
        badge = new BasedDoomS1(TOKEN_URI);
    }

    function testDeploySetsCollectionMetadata() public view {
        require(badge.MAX_SUPPLY() == 11, "max supply mismatch");
        require(keccak256(bytes(badge.name())) == keccak256(bytes("Based Doom S1")), "name mismatch");
        require(keccak256(bytes(badge.symbol())) == keccak256(bytes("DOOMS1")), "symbol mismatch");
        require(badge.totalMinted() == 0, "initial minted count mismatch");
    }

    function testOwnerCanMintWithSharedTokenUri() public {
        address recipient = address(0xBEEF);

        uint256 tokenId = badge.ownerMint(recipient);

        require(tokenId == 1, "token id mismatch");
        require(badge.ownerOf(tokenId) == recipient, "owner mismatch");
        require(badge.balanceOf(recipient) == 1, "balance mismatch");
        require(badge.totalMinted() == 1, "minted count mismatch");
        require(badge.hasMinted(recipient), "recipient should be marked");
        require(keccak256(bytes(badge.tokenURI(tokenId))) == keccak256(bytes(TOKEN_URI)), "uri mismatch");
    }

    function testNonOwnerCannotMint() public {
        address caller = address(0xCAFE);

        vm.prank(caller);
        vm.expectRevert();
        badge.ownerMint(address(0xBEEF));
    }

    function testCannotMintToZeroAddress() public {
        vm.expectRevert(abi.encodeWithSelector(BasedDoomS1.InvalidRecipient.selector));
        badge.ownerMint(address(0));
    }

    function testCannotMintTwiceToSameRecipient() public {
        address recipient = address(0xBEEF);

        badge.ownerMint(recipient);

        vm.expectRevert(abi.encodeWithSelector(BasedDoomS1.RecipientAlreadyMinted.selector, recipient));
        badge.ownerMint(recipient);
    }

    function testCannotMintAboveMaxSupply() public {
        for (uint256 index = 1; index <= badge.MAX_SUPPLY(); index++) {
            badge.ownerMint(address(uint160(index)));
        }

        vm.expectRevert(abi.encodeWithSelector(BasedDoomS1.MaxSupplyReached.selector));
        badge.ownerMint(address(100));
    }

    function testMintedNftIsTransferable() public {
        address recipient = address(0xBEEF);
        address receiver = address(0xCAFE);

        uint256 tokenId = badge.ownerMint(recipient);

        vm.prank(recipient);
        badge.transferFrom(recipient, receiver, tokenId);

        require(badge.ownerOf(tokenId) == receiver, "transfer owner mismatch");
        require(badge.balanceOf(recipient) == 0, "sender balance mismatch");
        require(badge.balanceOf(receiver) == 1, "receiver balance mismatch");
    }
}
