// SPDX-License-Identifier: Business Source License 1.1
pragma solidity ^0.8.0;

import {TokenStorage} from "./TokenStorage.sol";
import {ERC20} from "./ERC20.sol";
import {ERC20Capped} from "./ERC20Capped.sol";
import {Ownable} from "./Ownable.sol";

contract AgoraToken is TokenStorage, ERC20Capped, Ownable {
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(_accounts[from].whitelisted, "AgoraToken: token transfer while paused");
    }

    function _afterTokenTransfer(address from, address to, uint256) internal virtual override {
        _updateLevel(from);
        _updateLevel(to);
    }

    function _updateLevel(address account) internal {
        uint balance64 = balanceOf(account) / (10 ** decimals());
        AccountInfo storage accountInfo = _accountInfo(account);
        uint levelId = accountInfo.level;
        LevelInfo storage levelInfo = _levelInfo(levelId);

        while (balance64 >= levelInfo.balance64RequiredForNext && levelId < MAX_LEVEL) {
            levelId ++;
            levelInfo = _levelInfo(levelId);
        }

        while (balance64 < levelInfo.balance64RequiredForPrev && levelId > 0) {
            levelId --;
            levelInfo = _levelInfo(levelId);
        }

        accountInfo.level = uint16(levelId);
    }
    
    function addWhitelist(address account) public onlyOwner {
        AccountInfo storage accountInfo = _accountInfo(account);
        accountInfo.whitelisted = true;
    }

    function removeWhitelist(address account) public onlyOwner {
        AccountInfo storage accountInfo = _accountInfo(account);
        if (accountInfo.level == 0 && accountInfo.whitelisted) {
            _deleteAccountInfo(account);
        }
        else {
            accountInfo.whitelisted = false;
        }
    }

    function setLevels(LevelInfo[] calldata levels) public onlyOwner {
        require(levels.length < MAX_LEVEL, "AgoraToken: MAX_LEVEL limit exceeded.");
        for (uint levelId = 0; levelId < levels.length; levelId ++) {
            _levelInfo_call(levelId, levels[levelId]);
        }
    }

    function mint(address account, uint amount) public onlyOwner onlyInitialized {
        _mint(account, amount);
    }

    function initialize(string memory name_, string memory symbol_, uint256 cap_) public initializer {
        __ERC20_init(name_, symbol_);
        __ERC20Capped_init(cap_);
        __Ownable_init();
    }

    function initializeSignature(string memory name_, string memory symbol_, uint256 cap_) public pure returns (bytes memory) {
        return abi.encodeWithSelector(this.initialize.selector, name_, symbol_, cap_);
    }

    function getLevelInfo(address account) external view returns (uint16 level, uint16 boostK) {
        level = _accountInfo(account).level;
        boostK = _levelInfo(level).boostK;
    }

    function getLevelInfo2(address account) external view returns (uint16 level, uint16 boostK, uint8 maxLbForAga) {
        level = _accountInfo(account).level;
        boostK = _levelInfo(level).boostK;
        maxLbForAga = _levelInfo(level).maxLbForAga;
    }

}
