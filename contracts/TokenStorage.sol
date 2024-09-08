// SPDX-License-Identifier: Business Source License 1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract TokenStorage is Initializable {
    /**
     * @dev Contract wasn't properly initialized.
     * @param version required storage version.
     */
    error NotInitialized(uint8 version);

    struct AccountInfo {
        bool whitelisted;
        /// Current user level.
        uint16 level;
        uint232 _reserved;
        /// 256
    }

    struct LevelInfo {
        uint64 balance64RequiredForPrev;
        uint64 balance64RequiredForNext;
        uint16 boostK;
        uint112 _reserved;
        /// 256
    }

    uint internal constant MAX_LEVEL = 6;

    mapping(address => uint256) internal _balances;

    mapping(address => mapping(address => uint256)) internal _allowances;

    uint256 internal _totalSupply;

    string internal _name;
    string internal _symbol;

    // Ownable.sol
    address internal _owner;

    // AgoraToken.sol
    mapping (address => AccountInfo) internal _accounts;

    mapping (uint => LevelInfo) internal _levels;

    // ERC20Capped
    uint256 internal _cap;

    // @dev update this constant each time when you are added storage variables
    uint8 public constant STORAGE_VERSION = 1;

    modifier onlyInitialized() {
        if (_getInitializedVersion() != STORAGE_VERSION) {
            revert NotInitialized(STORAGE_VERSION);
        }
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function _accountInfo(address account) internal view returns (AccountInfo storage) {
        return _accounts[account];
    }

    function _accountInfo(address account, AccountInfo memory info) internal {
        _accounts[account] = info;
    }

    function _deleteAccountInfo(address account) internal {
        delete _accounts[account];
    }

    function _levelInfo(uint levelId) internal view returns (LevelInfo storage) {
        return _levels[levelId];
    }

    function _levelInfo(uint levelId, LevelInfo memory info) internal {
        _levels[levelId] = info;
    }

    function _levelInfo_call(uint levelId, LevelInfo calldata info) internal {
        _levels[levelId] = info;
    }
}