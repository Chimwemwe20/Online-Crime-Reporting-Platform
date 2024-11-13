// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AdminManager.sol"; // Import AdminManager contract
import "./UserManager.sol";  // Import UserManager contract

contract CrimeReport {
    struct Report {
        string ipfsHash;           // Hash of the crime report details stored on IPFS
        string location;           // Location of the crime
        string mediaIpfsHash;      // Hash of the media evidence stored on IPFS
        address reporter;          // Address of the reporter
        address resolvedBy;        // Address of the admin who resolved the case
        uint256 timestamp;         // Timestamp of when the report was made
        bool resolved;             // Status of the case
        string resolutionIpfsHash; // Hash of the resolution details stored on IPFS
    }

    uint256 public reportCount;
    AdminManager public adminManager;
    UserManager public userManager;
    mapping(uint256 => Report) public reports;
    mapping(address => uint256[]) private userReports; // Mapping to track report IDs by user

    event CrimeReported(uint256 reportId, address indexed reporter, string ipfsHash, string location, string mediaIpfsHash, uint256 timestamp);
    event CaseResolved(uint256 reportId, address indexed resolvedBy, string resolutionIpfsHash);

    modifier onlyAdmin() {
        require(adminManager.isAdmin(msg.sender), "Only admins can resolve cases.");
        _;
    }

    modifier onlyRegisteredUser() {
        require(userManager.isRegisteredUser(msg.sender), "Only registered users can report crimes.");
        _;
    }

    constructor(AdminManager _adminManager, UserManager _userManager) {
        adminManager = _adminManager;
        userManager = _userManager;
    }

    // Function to report a crime with location and media
    function reportCrime(string memory _ipfsHash, string memory _location, string memory _mediaIpfsHash) public onlyRegisteredUser {
        reports[reportCount] = Report({
            ipfsHash: _ipfsHash,
            location: _location,
            mediaIpfsHash: _mediaIpfsHash,
            reporter: msg.sender,
            resolvedBy: address(0),
            timestamp: block.timestamp,
            resolved: false,
            resolutionIpfsHash: ""
        });
        
        userReports[msg.sender].push(reportCount); // Track the report ID for the user

        emit CrimeReported(reportCount, msg.sender, _ipfsHash, _location, _mediaIpfsHash, block.timestamp);
        reportCount++;
    }

    // Function to resolve a case
    function resolveCase(uint256 _reportId, string memory _resolutionIpfsHash) public onlyAdmin {
        Report storage report = reports[_reportId];
        require(!report.resolved, "Case already resolved.");

        report.resolved = true;
        report.resolvedBy = msg.sender;
        report.resolutionIpfsHash = _resolutionIpfsHash; // Store the IPFS hash of the resolution details

        emit CaseResolved(_reportId, msg.sender, _resolutionIpfsHash);
    }

    // Function to get report details
    function getReport(uint256 _reportId) public view returns (
        string memory ipfsHash,
        string memory location,
        string memory mediaIpfsHash,
        address reporter,
        uint256 timestamp,
        bool resolved,
        address resolvedBy,
        string memory resolutionIpfsHash
    ) {
        Report storage report = reports[_reportId];
        return (
            report.ipfsHash,
            report.location,
            report.mediaIpfsHash,
            report.reporter,
            report.timestamp,
            report.resolved,
            report.resolvedBy,
            report.resolutionIpfsHash
        );
    }

    // Function to get all report IDs for a specific user
    function getReportIdsByUser(address userAddress) public view returns (uint256[] memory) {
        return userReports[userAddress];
    }
}
