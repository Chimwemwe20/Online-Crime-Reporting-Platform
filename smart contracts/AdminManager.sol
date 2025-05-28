// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AdminManager {
    address public owner;
    mapping(address => bool) public admins;

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Only admins can perform this action.");
        _;
    }

    constructor() {
        owner = msg.sender; // Set the deployer as the owner
        admins[msg.sender] = true; // Automatically make deployer an admin
    }

    // Check if an address is an admin
    function isAdmin(address _address) public view returns (bool) {
        return admins[_address];
    }

    // Function to add a new admin
    function addAdmin(address _admin) external onlyOwner {
        require(!admins[_admin], "Address is already an admin.");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    // Function to remove an admin
    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Address is not an admin.");
        delete admins[_admin];
        emit AdminRemoved(_admin);
    }
}
