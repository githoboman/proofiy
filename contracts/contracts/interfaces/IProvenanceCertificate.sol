// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProvenanceCertificate
 * @notice Interface for BOT Chain Provenance Certificate NFT contract
 */
interface IProvenanceCertificate {
    struct CertificateDetails {
        string storageId;
        string manifestHash;
        string attestationHash;
        address creator;
        uint256 timestamp;
    }

    event CertificateMinted(
        address indexed owner,
        uint256 indexed certificateId,
        string manifestHash,
        string storageId,
        uint256 timestamp
    );

    function mintCertificate(
        address to,
        string calldata storageId,
        string calldata manifestHash,
        string calldata attestationHash
    ) external returns (uint256);

    function getCertificate(uint256 certificateId)
        external
        view
        returns (CertificateDetails memory);

    function getCertificateIdByManifest(string calldata manifestHash)
        external
        view
        returns (uint256);

    function certificateExists(string calldata manifestHash)
        external
        view
        returns (bool);
}
