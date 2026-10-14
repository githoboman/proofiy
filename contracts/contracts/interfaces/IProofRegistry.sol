// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProofRegistry
 * @notice Interface for BOT Chain Proof Registry contract
 */
interface IProofRegistry {
    enum RequestState {
        Pending,
        Verified,
        Rejected,
        Failed
    }

    struct VerificationRequest {
        uint256 id;
        bytes32 contentHash;
        address requester;
        RequestState state;
        string rejectionReason;
        uint256 timestamp;
        uint256 certificateId;
    }

    struct Attestation {
        address provider;
        bytes32 teeHash;
        uint256 requestId;
    }

    event RequestCreated(uint256 indexed requestId, address indexed requester, bytes32 indexed contentHash);
    event RequestVerified(uint256 indexed requestId, uint256 indexed certificateId, address provider);
    event RequestRejected(uint256 indexed requestId, string reason, address provider);
    event ProviderAdded(address indexed provider);
    event ProviderRemoved(address indexed provider);
    event TeeHashAdded(bytes32 indexed teeHash, string label);
    event TeeHashRemoved(bytes32 indexed teeHash);

    function createRequest(bytes32 contentHash) external returns (uint256);
    function isProviderAuthorized(address provider) external view returns (bool);
    function isTeeHashAuthorized(bytes32 teeHash) external view returns (bool);
    function getRequest(uint256 requestId) external view returns (VerificationRequest memory);
}
