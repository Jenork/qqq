// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract GameProgress {
    error ItemAlreadyClaimed(uint256 itemId);
    error ItemRequiresPayment(uint256 itemId);
    error InvalidSlice();
    error InvalidToken();
    error InvalidRecipient();
    error CheckInUnavailable(uint256 nextAvailableAt);
    error ShotgunAlreadyUnlocked();
    error TokenTransferFailed();
    error InvalidSeason();

    uint256 public constant CURRENT_SEASON_ID = 2;
    uint256 public constant SHOTGUN_ITEM_ID = 2;
    uint256 public constant DAILY_CHECK_IN_INTERVAL = 1 days;

    mapping(address => mapping(uint256 => bool)) public unlockedItems;
    mapping(address => uint256) public bestScore;
    mapping(address => bool) public hasEntry;
    mapping(address => uint256) public lastCheckInAt;
    mapping(address => uint256) public checkInCount;
    mapping(uint256 => mapping(address => uint256)) private seasonBestScore;
    mapping(uint256 => mapping(address => bool)) private seasonHasEntry;
    mapping(uint256 => mapping(address => uint256)) private seasonLastCheckInAt;
    mapping(uint256 => mapping(address => uint256)) private seasonCheckInCount;

    address[] private players;
    mapping(uint256 => address[]) private seasonPlayers;

    address public immutable usdcToken;
    address public immutable usdcRecipient;
    uint256 public immutable shotgunPrice;

    event ItemClaimed(address indexed player, uint256 indexed itemId);
    event ScoreSubmitted(address indexed player, uint256 submittedScore, uint256 storedBestScore);
    event SeasonScoreSubmitted(
        address indexed player,
        uint256 indexed seasonId,
        uint256 submittedScore,
        uint256 storedBestScore
    );
    event DailyCheckedIn(address indexed player, uint256 timestamp, uint256 totalCount);
    event SeasonDailyCheckedIn(
        address indexed player,
        uint256 indexed seasonId,
        uint256 timestamp,
        uint256 totalCount
    );
    event ShotgunPurchased(address indexed player, uint256 amount, address recipient);

    constructor(address usdcToken_, address usdcRecipient_, uint256 shotgunPrice_) {
        if (usdcToken_ == address(0)) {
            revert InvalidToken();
        }

        if (usdcRecipient_ == address(0)) {
            revert InvalidRecipient();
        }

        usdcToken = usdcToken_;
        usdcRecipient = usdcRecipient_;
        shotgunPrice = shotgunPrice_;
    }

    function claimItem(uint256 itemId) external {
        if (itemId == SHOTGUN_ITEM_ID) {
            revert ItemRequiresPayment(itemId);
        }

        if (unlockedItems[msg.sender][itemId]) {
            revert ItemAlreadyClaimed(itemId);
        }

        unlockedItems[msg.sender][itemId] = true;
        emit ItemClaimed(msg.sender, itemId);
    }

    function dailyCheckIn() external {
        if (!canCheckIn(msg.sender)) {
            revert CheckInUnavailable(lastCheckInAt[msg.sender] + DAILY_CHECK_IN_INTERVAL);
        }

        uint256 timestamp = block.timestamp;
        lastCheckInAt[msg.sender] = timestamp;
        checkInCount[msg.sender] += 1;

        emit DailyCheckedIn(msg.sender, timestamp, checkInCount[msg.sender]);
    }

    function dailyCurrentSeasonCheckIn() external {
        dailySeasonCheckIn(CURRENT_SEASON_ID);
    }

    function dailySeasonCheckIn(uint256 seasonId) public {
        if (seasonId == 0) {
            revert InvalidSeason();
        }

        if (!canSeasonCheckIn(seasonId, msg.sender)) {
            revert CheckInUnavailable(seasonLastCheckInAt[seasonId][msg.sender] + DAILY_CHECK_IN_INTERVAL);
        }

        uint256 timestamp = block.timestamp;
        seasonLastCheckInAt[seasonId][msg.sender] = timestamp;
        seasonCheckInCount[seasonId][msg.sender] += 1;

        emit SeasonDailyCheckedIn(msg.sender, seasonId, timestamp, seasonCheckInCount[seasonId][msg.sender]);
    }

    function purchaseShotgun() external {
        if (unlockedItems[msg.sender][SHOTGUN_ITEM_ID]) {
            revert ShotgunAlreadyUnlocked();
        }

        bool transferred = IERC20(usdcToken).transferFrom(msg.sender, usdcRecipient, shotgunPrice);

        if (!transferred) {
            revert TokenTransferFailed();
        }

        unlockedItems[msg.sender][SHOTGUN_ITEM_ID] = true;

        emit ShotgunPurchased(msg.sender, shotgunPrice, usdcRecipient);
        emit ItemClaimed(msg.sender, SHOTGUN_ITEM_ID);
    }

    function canCheckIn(address player) public view returns (bool) {
        uint256 lastTimestamp = lastCheckInAt[player];
        return lastTimestamp == 0 || block.timestamp >= lastTimestamp + DAILY_CHECK_IN_INTERVAL;
    }

    function canSeasonCheckIn(uint256 seasonId, address player) public view returns (bool) {
        uint256 lastTimestamp = seasonLastCheckInAt[seasonId][player];
        return lastTimestamp == 0 || block.timestamp >= lastTimestamp + DAILY_CHECK_IN_INTERVAL;
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

    function submitCurrentSeasonScore(uint256 score) external {
        submitSeasonScore(CURRENT_SEASON_ID, score);
    }

    function submitSeasonScore(uint256 seasonId, uint256 score) public {
        if (seasonId == 0) {
            revert InvalidSeason();
        }

        uint256 storedBestScore = seasonBestScore[seasonId][msg.sender];

        if (!seasonHasEntry[seasonId][msg.sender]) {
            seasonHasEntry[seasonId][msg.sender] = true;
            seasonPlayers[seasonId].push(msg.sender);
            seasonBestScore[seasonId][msg.sender] = score;
            storedBestScore = score;
        } else if (score > storedBestScore) {
            seasonBestScore[seasonId][msg.sender] = score;
            storedBestScore = score;
        }

        emit SeasonScoreSubmitted(msg.sender, seasonId, score, storedBestScore);
    }

    function getBestScore(address player) external view returns (uint256) {
        return bestScore[player];
    }

    function getSeasonBestScore(uint256 seasonId, address player) external view returns (uint256) {
        return seasonBestScore[seasonId][player];
    }

    function getLastCheckIn(address player) external view returns (uint256) {
        return lastCheckInAt[player];
    }

    function getCheckInCount(address player) external view returns (uint256) {
        return checkInCount[player];
    }

    function getSeasonLastCheckIn(uint256 seasonId, address player) external view returns (uint256) {
        return seasonLastCheckInAt[seasonId][player];
    }

    function getSeasonCheckInCount(uint256 seasonId, address player) external view returns (uint256) {
        return seasonCheckInCount[seasonId][player];
    }

    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }

    function getSeasonPlayersCount(uint256 seasonId) external view returns (uint256) {
        return seasonPlayers[seasonId].length;
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

    function getSeasonPlayersSlice(
        uint256 seasonId,
        uint256 start,
        uint256 end
    ) external view returns (address[] memory slice) {
        address[] storage storedPlayers = seasonPlayers[seasonId];

        if (start > end || end > storedPlayers.length) {
            revert InvalidSlice();
        }

        slice = new address[](end - start);
        for (uint256 index = start; index < end; index++) {
            slice[index - start] = storedPlayers[index];
        }
    }
}
