// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IProvenanceCertificate.sol";

/**
 * @title ProvenanceCertificate
 * @notice Immutable digital media authenticity certificate NFT contract for BOT Chain.
 * @dev Deployed on BOT Chain (Chain ID 677 / 968). Fully EVM-compatible.
 */
contract ProvenanceCertificate is IProvenanceCertificate {
    string public name = "BOT Chain Provenance Certificate";
    string public symbol = "BOTCERT";

    address public owner;
    address public authorizedOracle;
    uint256 private _certificateCounter;

    // Certificate ID => CertificateDetails
    mapping(uint256 => CertificateDetails) private _certificates;

    // Manifest Hash => Certificate ID (prevents duplicates)
    mapping(string => uint256) private _manifestToCertificateId;

    // ERC-721 minimal mappings
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event OracleUpdated(address indexed previousOracle, address indexed newOracle);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyOracleOrOwner() {
        require(
            msg.sender == authorizedOracle || msg.sender == owner,
            "Only authorized oracle or owner can call"
        );
        _;
    }

    constructor(address _authorizedOracle) {
        owner = msg.sender;
        authorizedOracle = _authorizedOracle;
        emit OwnershipTransferred(address(0), msg.sender);
        if (_authorizedOracle != address(0)) {
            emit OracleUpdated(address(0), _authorizedOracle);
        }
    }

    /**
     * @notice Set or update the authorized oracle address.
     */
    function setAuthorizedOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        emit OracleUpdated(authorizedOracle, newOracle);
        authorizedOracle = newOracle;
    }

    /**
     * @notice Transfer ownership of the contract.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Mints a new provenance certificate for verified content.
     * @param to The recipient address (creator / owner).
     * @param storageId The IPFS CID or decentralised storage identifier.
     * @param manifestHash SHA-256 hex digest of the manifest.
     * @param attestationHash Cryptographic TEE attestation proof hash.
     * @return certificateId The unique minted certificate ID.
     */
    function mintCertificate(
        address to,
        string calldata storageId,
        string calldata manifestHash,
        string calldata attestationHash
    ) external override onlyOracleOrOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(manifestHash).length > 0, "Manifest hash required");
        require(_manifestToCertificateId[manifestHash] == 0, "Certificate already exists for manifest");

        _certificateCounter++;
        uint256 newCertId = _certificateCounter;

        _certificates[newCertId] = CertificateDetails({
            storageId: storageId,
            manifestHash: manifestHash,
            attestationHash: attestationHash,
            creator: to,
            timestamp: block.timestamp
        });

        _manifestToCertificateId[manifestHash] = newCertId;

        // Update balances and ownership
        _owners[newCertId] = to;
        _balances[to]++;

        emit Transfer(address(0), to, newCertId);
        emit CertificateMinted(to, newCertId, manifestHash, storageId, block.timestamp);

        return newCertId;
    }

    /**
     * @notice Retrieve certificate details by ID.
     */
    function getCertificate(uint256 certificateId)
        external
        view
        override
        returns (CertificateDetails memory)
    {
        require(certificateId > 0 && certificateId <= _certificateCounter, "Certificate not found");
        return _certificates[certificateId];
    }

    /**
     * @notice Lookup certificate ID by manifest hash.
     */
    function getCertificateIdByManifest(string calldata manifestHash)
        external
        view
        override
        returns (uint256)
    {
        return _manifestToCertificateId[manifestHash];
    }

    /**
     * @notice Check if a certificate already exists for a manifest hash.
     */
    function certificateExists(string calldata manifestHash)
        external
        view
        override
        returns (bool)
    {
        return _manifestToCertificateId[manifestHash] != 0;
    }

    /**
     * @notice Total number of certificates minted on BOT Chain.
     */
    function totalCertificates() external view returns (uint256) {
        return _certificateCounter;
    }

    // ERC-721 standard read functions
    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero address query");
        return _balances[account];
    }
}
