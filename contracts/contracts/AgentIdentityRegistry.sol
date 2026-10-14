// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentIdentityRegistry
 * @notice ERC-8004 compatible AI Agent Identity and Provenance Binding for BOT Chain.
 * @dev Enables autonomous AI agents on BOT Chain to register identities and bind certified media assets.
 */
contract AgentIdentityRegistry {
    struct AgentProfile {
        string externalAgentId;
        address walletAddress;
        address ownerAddress;
        string metadataUri;
        uint256 createdAt;
        bool isActive;
    }

    event AgentRegistered(
        uint256 indexed agentId,
        string externalAgentId,
        address indexed walletAddress,
        address indexed ownerAddress
    );
    event AgentWalletBound(uint256 indexed agentId, address indexed walletAddress);
    event ProvenanceBoundToAgent(uint256 indexed agentId, uint256 indexed certificateId);

    uint256 private _agentCounter;
    mapping(uint256 => AgentProfile) private _agents;
    mapping(string => uint256) private _externalIdToAgentId;
    mapping(address => uint256) private _walletToAgentId;

    // Agent ID => list of certificate IDs
    mapping(uint256 => uint256[]) private _agentCertificates;

    /**
     * @notice Register an ERC-8004 AI Agent identity on BOT Chain.
     */
    function registerAgent(
        string calldata externalAgentId,
        address walletAddress,
        string calldata metadataUri
    ) external returns (uint256) {
        require(bytes(externalAgentId).length > 0, "External Agent ID required");
        require(walletAddress != address(0), "Invalid wallet address");
        require(_externalIdToAgentId[externalAgentId] == 0, "Agent ID already exists");
        require(_walletToAgentId[walletAddress] == 0, "Wallet already bound to an agent");

        _agentCounter++;
        uint256 newAgentId = _agentCounter;

        _agents[newAgentId] = AgentProfile({
            externalAgentId: externalAgentId,
            walletAddress: walletAddress,
            ownerAddress: msg.sender,
            metadataUri: metadataUri,
            createdAt: block.timestamp,
            isActive: true
        });

        _externalIdToAgentId[externalAgentId] = newAgentId;
        _walletToAgentId[walletAddress] = newAgentId;

        emit AgentRegistered(newAgentId, externalAgentId, walletAddress, msg.sender);
        return newAgentId;
    }

    /**
     * @notice Bind a verified provenance certificate to the agent's on-chain identity.
     */
    function bindProvenanceCertificate(uint256 agentId, uint256 certificateId) external {
        AgentProfile storage agent = _agents[agentId];
        require(agent.isActive, "Agent not active");
        require(
            msg.sender == agent.ownerAddress || msg.sender == agent.walletAddress,
            "Not authorized to bind for this agent"
        );

        _agentCertificates[agentId].push(certificateId);
        emit ProvenanceBoundToAgent(agentId, certificateId);
    }

    function getAgent(uint256 agentId) external view returns (AgentProfile memory) {
        require(agentId > 0 && agentId <= _agentCounter, "Agent not found");
        return _agents[agentId];
    }

    function getAgentByWallet(address wallet) external view returns (uint256) {
        return _walletToAgentId[wallet];
    }

    function getAgentCertificates(uint256 agentId) external view returns (uint256[] memory) {
        return _agentCertificates[agentId];
    }

    function totalAgents() external view returns (uint256) {
        return _agentCounter;
    }
}
