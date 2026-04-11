// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {GameProgress} from "../src/GameProgress.sol";

contract GameProgressTest {
    GameProgress private progress;

    function setUp() public {
        progress = new GameProgress();
    }

    function testClaimItemMarksUnlock() public {
        progress.claimItem(2);
        require(progress.isItemUnlocked(address(this), 2), "item should unlock");
    }

    function testSubmitScoreStoresBestOnly() public {
        progress.submitScore(50);
        progress.submitScore(10);
        progress.submitScore(77);

        require(progress.getBestScore(address(this)) == 77, "best score mismatch");
        require(progress.getPlayersCount() == 1, "player should only be added once");
    }

    function testPlayersSliceReturnsStoredEntries() public {
        progress.submitScore(5);

        PlayerSubmitter other = new PlayerSubmitter(progress);
        other.submit(11);

        address[] memory slice = progress.getPlayersSlice(0, 2);

        require(slice.length == 2, "slice length mismatch");
        require(slice[0] == address(this), "first player mismatch");
        require(slice[1] == address(other), "second player mismatch");
    }
}

contract PlayerSubmitter {
    GameProgress private immutable progress;

    constructor(GameProgress progress_) {
        progress = progress_;
    }

    function submit(uint256 score) external {
        progress.submitScore(score);
    }
}
