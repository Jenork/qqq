// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract GameProgress {
    error ItemAlreadyClaimed(uint256 itemId);
    error InvalidSlice();

    mapping(address => mapping(uint256 => bool)) public unlockedItems;
    mapping(address => uint256) public bestScore;
    mapping(address => bool) public hasEntry;
    address[] private players;

    event ItemClaimed(address indexed player, uint256 indexed itemId);
    event ScoreSubmitted(address indexed player, uint256 submittedScore, uint256 storedBestScore);

    function claimItem(uint256 itemId) external {
        if (unlockedItems[msg.sender][itemId]) {
            revert ItemAlreadyClaimed(itemId);
        }

        unlockedItems[msg.sender][itemId] = true;
        emit ItemClaimed(msg.sender, itemId);
    }

    function isItemUnlocked(address player, uint256 itemId) external view returns (bool) {
        return unlockedItems[player][itemId];
    }

    function submitScore(uint256 score) external {
        uint256 storedBestScore = bestScore[msg.sender];

        if (!hasEntry[msg.sender]) {
            hasEntry[msg.sender] = true;
            players.push(msg.sender);
            bestScore[msg.sender] = score;
            storedBestScore = score;
        } else if (score > storedBestScore) {
            bestScore[msg.sender] = score;
            storedBestScore = score;
        }

        emit ScoreSubmitted(msg.sender, score, storedBestScore);
    }

    function getBestScore(address player) external view returns (uint256) {
        return bestScore[player];
    }

    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }

    function getPlayersSlice(uint256 start, uint256 end) external view returns (address[] memory slice) {
        if (start > end || end > players.length) {
            revert InvalidSlice();
        }

        slice = new address[](end - start);
        for (uint256 index = start; index < end; index++) {
            slice[index - start] = players[index];
        }
    }
}
