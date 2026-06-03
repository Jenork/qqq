// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {GameProgress} from "../src/GameProgress.sol";

interface Vm {
    function warp(uint256 newTimestamp) external;
}

contract GameProgressTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 private constant SHOTGUN_PRICE = 300000;

    GameProgress private progress;
    MockUSDC private usdc;

    function setUp() public {
        usdc = new MockUSDC();
        progress = new GameProgress(address(usdc), address(0xBEEF), SHOTGUN_PRICE);
    }

    function testClaimItemMarksUnlock() public {
        progress.claimItem(22);
        require(progress.isItemUnlocked(address(this), 22), "item should unlock");
    }

    function testDailyCheckInStoresTimestampAndCount() public {
        progress.dailyCheckIn();

        require(!progress.canCheckIn(address(this)), "check-in should be blocked for a day");
        require(progress.getCheckInCount(address(this)) == 1, "check-in count mismatch");
        require(progress.getLastCheckIn(address(this)) > 0, "timestamp should be stored");
    }

    function testDailyCheckInUnlocksAfterOneDay() public {
        progress.dailyCheckIn();
        uint256 nextAvailableAt = progress.getLastCheckIn(address(this)) + progress.DAILY_CHECK_IN_INTERVAL();

        vm.warp(nextAvailableAt);

        require(progress.canCheckIn(address(this)), "check-in should reopen after one day");
    }

    function testSeasonDailyCheckInStoresSeparateCount() public {
        progress.dailySeasonCheckIn(2);

        require(!progress.canSeasonCheckIn(2, address(this)), "season check-in should be blocked for a day");
        require(progress.getSeasonCheckInCount(2, address(this)) == 1, "season check-in count mismatch");
        require(progress.getSeasonLastCheckIn(2, address(this)) > 0, "season timestamp should be stored");
        require(progress.getCheckInCount(address(this)) == 0, "legacy check-in count should stay untouched");
    }

    function testSeasonDailyCheckInUnlocksAfterOneDay() public {
        progress.dailySeasonCheckIn(2);
        uint256 nextAvailableAt = progress.getSeasonLastCheckIn(2, address(this)) + progress.DAILY_CHECK_IN_INTERVAL();

        vm.warp(nextAvailableAt);

        require(progress.canSeasonCheckIn(2, address(this)), "season check-in should reopen after one day");
    }

    function testSubmitScoreStoresBestOnly() public {
        progress.submitScore(50);
        progress.submitScore(10);
        progress.submitScore(77);

        require(progress.getBestScore(address(this)) == 77, "best score mismatch");
        require(progress.getPlayersCount() == 1, "player should only be added once");
    }

    function testSubmitSeasonScoreStoresBestOnlyForSeason() public {
        progress.submitSeasonScore(2, 50);
        progress.submitSeasonScore(2, 10);
        progress.submitSeasonScore(2, 77);

        require(progress.getSeasonBestScore(2, address(this)) == 77, "season best score mismatch");
        require(progress.getBestScore(address(this)) == 0, "legacy best score should stay untouched");
        require(progress.getSeasonPlayersCount(2) == 1, "season player should only be added once");
    }

    function testSeasonPlayersSliceReturnsSeasonEntries() public {
        progress.submitSeasonScore(2, 5);

        PlayerSubmitter other = new PlayerSubmitter(progress);
        other.submitSeason(2, 11);

        address[] memory slice = progress.getSeasonPlayersSlice(2, 0, 2);

        require(slice.length == 2, "slice length mismatch");
        require(slice[0] == address(this), "first season player mismatch");
        require(slice[1] == address(other), "second season player mismatch");
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

    function testPurchaseShotgunTransfersUsdcAndUnlocks() public {
        ShotgunBuyer buyer = new ShotgunBuyer(progress, usdc);

        usdc.mint(address(buyer), SHOTGUN_PRICE);
        buyer.approveAndPurchase(SHOTGUN_PRICE);

        require(progress.isItemUnlocked(address(buyer), progress.SHOTGUN_ITEM_ID()), "shotgun should unlock");
        require(usdc.balanceOf(address(0xBEEF)) == SHOTGUN_PRICE, "recipient should receive USDC");
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

    function submitSeason(uint256 seasonId, uint256 score) external {
        progress.submitSeasonScore(seasonId, score);
    }
}

contract ShotgunBuyer {
    GameProgress private immutable progress;
    MockUSDC private immutable usdc;

    constructor(GameProgress progress_, MockUSDC usdc_) {
        progress = progress_;
        usdc = usdc_;
    }

    function approveAndPurchase(uint256 amount) external {
        usdc.approve(address(progress), amount);
        progress.purchaseShotgun();
    }
}

contract MockUSDC {
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    function mint(address to, uint256 amount) external {
        balances[to] += amount;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowances[msg.sender][spender] = value;
        return true;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = allowances[from][msg.sender];
        require(currentAllowance >= value, "allowance too low");
        require(balances[from] >= value, "balance too low");

        allowances[from][msg.sender] = currentAllowance - value;
        balances[from] -= value;
        balances[to] += value;
        return true;
    }
}
