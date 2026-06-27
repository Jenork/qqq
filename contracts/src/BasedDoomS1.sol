// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BasedDoomS1 is ERC721, Ownable {
    error MaxSupplyReached();
    error RecipientAlreadyMinted(address recipient);
    error InvalidRecipient();
    error EmptyTokenUri();

    uint256 public constant MAX_SUPPLY = 11;

    string private immutable sharedTokenUri;
    uint256 private mintedCount;

    mapping(address => bool) public hasMinted;

    event SeasonOneBadgeMinted(address indexed recipient, uint256 indexed tokenId);

    constructor(string memory tokenUri_) ERC721("Based Doom S1", "DOOMS1") Ownable(msg.sender) {
        if (bytes(tokenUri_).length == 0) {
            revert EmptyTokenUri();
        }

        sharedTokenUri = tokenUri_;
    }

    function ownerMint(address recipient) external onlyOwner returns (uint256 tokenId) {
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }

        if (hasMinted[recipient]) {
            revert RecipientAlreadyMinted(recipient);
        }

        if (mintedCount >= MAX_SUPPLY) {
            revert MaxSupplyReached();
        }

        tokenId = mintedCount + 1;
        mintedCount = tokenId;
        hasMinted[recipient] = true;

        _safeMint(recipient, tokenId);

        emit SeasonOneBadgeMinted(recipient, tokenId);
    }

    function totalMinted() external view returns (uint256) {
        return mintedCount;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return sharedTokenUri;
    }
}
