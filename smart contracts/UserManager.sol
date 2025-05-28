// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AdminManager.sol"; // Import AdminManager contract

contract UserManager {
    address public deployer;
    AdminManager public adminManager;
    mapping(address => bool) public registeredUsers;

    event UserRegistered(address indexed user);
    event UserDeregistered(address indexed user);

    constructor(AdminManager _adminManager) {
        deployer = msg.sender;
        adminManager = _adminManager;
    }

    // Users can now register themselves
    function registerUser() external {
        require(!registeredUsers[msg.sender], "User is already registered.");
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    // Admins can deregister any user
    function deregisterUser(address user) external {
        require(adminManager.isAdmin(msg.sender), "Only admins can deregister users.");
        require(registeredUsers[user], "User is not registered.");
        registeredUsers[user] = false;
        emit UserDeregistered(user);
    }

    // Check if an address is registered
    function isRegisteredUser(address user) external view returns (bool) {
        return registeredUsers[user];
    }
}
