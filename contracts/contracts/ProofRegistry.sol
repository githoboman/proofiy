// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IProofRegistry.sol";
import "./interfaces/IProvenanceCertificate.sol";

/**
 * @title ProofRegistry
 * @notice Central registry for verifying digital content provenance on BOT Chain.
 * @dev Manages trusted TEE measurements, authorized oracle providers, and verification requests.
 */
contract ProofRegistry is IProofRegistry {
    address public admin;
    IProvenanceCertificate public provenanceContract;
    uint256 private _requestCounter;

    // Authorized oracle provider addresses
    mapping(address => bool) public override isProviderAuthorized;

    // Authorized TEE measurement hashes (e.g. AWS Nitro Enclave PCR hashes)
    mapping(bytes32 => bool) public override isTeeHashAuthorized;
    mapping(bytes32 => string) public teeHashLabels;

    // Request ID => VerificationRequest
    mapping(uint256 => VerificationRequest) private _requests;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call");
        _;
    }

    constructor(address _provenanceContract) {
        admin = msg.sender;
        if (_provenanceContract != address(0)) {
            provenanceContract = IProvenanceCertificate(_provenanceContract);
        }
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid new admin");
        admin = newAdmin;
    }

    function setProvenanceContract(address _provenanceContract) external onlyAdmin {
        require(_provenanceContract != address(0), "Invalid contract address");
        provenanceContract = IProvenanceCertificate(_provenanceContract);
    }

    function addProvider(address provider) external onlyAdmin {
        require(provider != address(0), "Invalid provider address");
        require(!isProviderAuthorized[provider], "Provider already authorized");
        isProviderAuthorized[provider] = true;
        emit ProviderAdded(provider);
    }

    function removeProvider(address provider) external onlyAdmin {
        require(isProviderAuthorized[provider], "Provider not authorized");
        isProviderAuthorized[provider] = false;
        emit ProviderRemoved(provider);
    }

    function addTeeHash(bytes32 teeHash, string calldata label) external onlyAdmin {
        require(teeHash != bytes32(0), "Invalid TEE hash");
        require(!isTeeHashAuthorized[teeHash], "TEE hash already authorized");
        isTeeHashAuthorized[teeHash] = true;
        teeHashLabels[teeHash] = label;
        emit TeeHashAdded(teeHash, label);
    }

    function removeTeeHash(bytes32 teeHash) external onlyAdmin {
        require(isTeeHashAuthorized[teeHash], "TEE hash not authorized");
        isTeeHashAuthorized[teeHash] = false;
        delete teeHashLabels[teeHash];
        emit TeeHashRemoved(teeHash);
    }

    /**
     * @notice Initiates a content verification request.
     * @param contentHash SHA-256 / keccak256 hash of the content to be verified.
     */
    function createRequest(bytes32 contentHash) external override returns (uint256) {
        require(contentHash != bytes32(0), "Content hash required");
        _requestCounter++;
        uint256 reqId = _requestCounter;

        _requests[reqId] = VerificationRequest({
            id: reqId,
            contentHash: contentHash,
            requester: msg.sender,
            state: RequestState.Pending,
            rejectionReason: "",
            timestamp: block.timestamp,
            certificateId: 0
        });

        emit RequestCreated(reqId, msg.sender, contentHash);
        return reqId;
    }

    /**
     * @notice Processes verification from an authorized Oracle / TEE enclave.
     * @param requestId The request ID to process.
     * @param teeHash The TEE measurement hash that performed verification.
     * @param storageId The off-chain storage pointer (IPFS CID or db id).
     * @param manifestHash Hash of the manifest.
     * @param attestationHash Hash of the signed attestation document.
     * @param signature Cryptographic signature by the authorized provider.
     */
    function processVerification(
        uint256 requestId,
        bytes32 teeHash,
        string calldata storageId,
        string calldata manifestHash,
        string calldata attestationHash,
        bytes calldata signature
    ) external returns (bool) {
        VerificationRequest storage req = _requests[requestId];
        require(req.id != 0, "Request not found");
        require(req.state == RequestState.Pending, "Already processed");

        // Verify ECDSA signature of the attestation payload
        bytes32 messageHash = keccak256(
            abi.encodePacked(requestId, teeHash, manifestHash, attestationHash)
        );
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);

        // Check provider authorization
        if (!isProviderAuthorized[recoveredSigner]) {
            req.state = RequestState.Rejected;
            req.rejectionReason = "Unauthorized";
            emit RequestRejected(requestId, "Unauthorized", recoveredSigner);
            return false;
        }

        // Check TEE hash authorization
        if (!isTeeHashAuthorized[teeHash]) {
            req.state = RequestState.Rejected;
            req.rejectionReason = "InvalidTeeHash";
            emit RequestRejected(requestId, "InvalidTeeHash", recoveredSigner);
            return false;
        }

        // Full success: Mint certificate on BOT Chain
        uint256 certId = 0;
        if (address(provenanceContract) != address(0)) {
            certId = provenanceContract.mintCertificate(
                req.requester,
                storageId,
                manifestHash,
                attestationHash
            );
        }

        req.state = RequestState.Verified;
        req.certificateId = certId;
        emit RequestVerified(requestId, certId, recoveredSigner);

        return true;
    }

    function getRequest(uint256 requestId)
        external
        view
        override
        returns (VerificationRequest memory)
    {
        require(requestId != 0 && requestId <= _requestCounter, "Request not found");
        return _requests[requestId];
    }

    function totalRequests() external view returns (uint256) {
        return _requestCounter;
    }

    function _recoverSigner(bytes32 messageHash, bytes memory sig)
        internal
        pure
        returns (address)
    {
        if (sig.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return address(0);
        }

        return ecrecover(messageHash, v, r, s);
    }
}
