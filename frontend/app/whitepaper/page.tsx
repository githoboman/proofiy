"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Cpu,
  Layers,
  ExternalLink,
  CheckCircle2,
  Copy,
  Download,
  Terminal,
  ArrowRight,
  Database,
  Lock,
  GitCommit,
} from "lucide-react";

interface TxRecord {
  step: string;
  txHash: string;
  blockNumber: number;
  summary: string;
  explorerUrl: string;
  gasUsed: string;
}

const LIVE_TRANSACTIONS: TxRecord[] = [
  {
    step: "1. Authorize AWS Nitro Enclave PCR0 Hash",
    txHash: "0x9482db7b2f7572dad3d3573c571191641e4abe055a7b3ba7215823770d61100d",
    blockNumber: 26916498,
    summary: "Registered TEE measurement hash in ProofRegistry (AWS Nitro Enclave v2.4)",
    explorerUrl: "https://scan.bohr.life/tx/0x9482db7b2f7572dad3d3573c571191641e4abe055a7b3ba7215823770d61100d",
    gasUsed: "116,910",
  },
  {
    step: "2. Whitelist Authorized Oracle Node Provider",
    txHash: "0xbaa9940ff513f8bb9b3a950ce42d2e398bc4b90669633b9cd372b7bcc5f5673e",
    blockNumber: 26916502,
    summary: "Authorized oracle node 0x1eEFd10C20d9... in ProofRegistry for processing attestations",
    explorerUrl: "https://scan.bohr.life/tx/0xbaa9940ff513f8bb9b3a950ce42d2e398bc4b90669633b9cd372b7bcc5f5673e",
    gasUsed: "47,547",
  },
  {
    step: "3. Register ERC-8004 Autonomous AI Agent",
    txHash: "0x602ee2cbdc5ad01f514944e356e0a3b78baced589cb6c300af52c94d579f3979",
    blockNumber: 26916507,
    summary: 'Registered autonomous agent "proofiy-sentinel-854929" (ID: #1) bound to wallet',
    explorerUrl: "https://scan.bohr.life/tx/0x602ee2cbdc5ad01f514944e356e0a3b78baced589cb6c300af52c94d579f3979",
    gasUsed: "272,126",
  },
  {
    step: "4. Create Content Verification Request",
    txHash: "0xdda31affbaa6db08c14cbfee2c9da1d6909e9653cf53a3f257a7a47d0c594db0",
    blockNumber: 26916511,
    summary: "Logged verification request #1 for synthetic media content digest on-chain",
    explorerUrl: "https://scan.bohr.life/tx/0xdda31affbaa6db08c14cbfee2c9da1d6909e9653cf53a3f257a7a47d0c594db0",
    gasUsed: "140,319",
  },
  {
    step: "5. Mint ERC-721 Provenance Certificate",
    txHash: "0x8fe6826681fa31510650e612bba5f3ed4cf7fe8938ed2f1da953be94a6a5075b",
    blockNumber: 26916516,
    summary: "Minted verified provenance certificate #1 (BOTCERT NFT) with TEE attestation digest",
    explorerUrl: "https://scan.bohr.life/tx/0x8fe6826681fa31510650e612bba5f3ed4cf7fe8938ed2f1da953be94a6a5075b",
    gasUsed: "281,194",
  },
  {
    step: "6. Bind Certificate to AI Agent Identity",
    txHash: "0x1f0157bfdf6498d5310bf50549d74301cd927b539cf348a2afa6e238fbdf4a61",
    blockNumber: 26916521,
    summary: "Bound certificate #1 to ERC-8004 Agent #1 establishing verifiable provenance rating",
    explorerUrl: "https://scan.bohr.life/tx/0x1f0157bfdf6498d5310bf50549d74301cd927b539cf348a2afa6e238fbdf4a61",
    gasUsed: "71,853",
  },
];

export default function WhitepaperPage() {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-blue-400 font-medium">Protocol Whitepaper</span>
        </div>

        {/* Hero Title */}
        <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 mb-12 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5" />
            BOT Chain Layer 1 • Protocol Specification
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Proofiy Protocol Whitepaper
          </h1>
          <p className="text-lg text-slate-300 max-w-4xl leading-relaxed">
            Cryptographic Provenance, Confidential TEE Attestation & ERC-8004 AI Agent
            Identity natively anchored to BOT Chain (Layer 1 EVM).
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-500">Version:</span>
              <span className="font-mono text-blue-300">2.4.0-EVM</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-500">Target:</span>
              <span className="font-mono text-emerald-400">Bohr Testnet (Chain ID 968)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-500">Standard:</span>
              <span className="font-mono text-pink-300">ERC-8004 / ERC-721</span>
            </div>
            <a
              href="https://github.com/githoboman/proofiy/blob/main/docs/WHITEPAPER.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors ml-auto shadow-lg shadow-blue-500/20"
            >
              <FileText className="w-4 h-4" />
              View on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live On-Chain Interactions Showcase */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Live Proof-of-Execution on Bohr Testnet
              </div>
              <h2 className="text-2xl font-bold text-white">
                Live On-Chain Transaction Audit (6 Verified Txns)
              </h2>
            </div>
            <a
              href="https://scan.bohr.life/address/0xA4A42E4873d57Dd91fA9D41D5956EA51E4D69DE9"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Deployer Contract Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LIVE_TRANSACTIONS.map((tx, idx) => (
              <div
                key={tx.txHash}
                className="border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-blue-500/40 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-blue-400">Step {idx + 1} of 6</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20">
                      Block #{tx.blockNumber}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                    {tx.step}
                  </h3>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    {tx.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2 font-mono">
                    <span>Gas: {tx.gasUsed}</span>
                    <button
                      onClick={() => copyToClipboard(tx.txHash, tx.txHash)}
                      className="hover:text-white flex items-center gap-1 transition-colors"
                      title="Copy Tx Hash"
                    >
                      {copiedHash === tx.txHash ? (
                        <span className="text-emerald-400">Copied!</span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium font-mono text-[11px] truncate w-full"
                  >
                    <span>{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deep Dive Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Section 1: Abstract */}
            <section id="abstract" className="border border-slate-800 bg-slate-900/40 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-blue-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-xl font-bold text-white">1. Executive Summary & Problem Space</h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4 text-sm sm:text-base">
                As generative AI agents and autonomous swarms assume economic agency across DePIN and Web3, the boundary between authentic media and synthetic manipulation has collapsed. Without cryptographic proof of origin and runtime verification, autonomous workflows remain untrusted, vulnerable to prompt injection, and prone to spoofing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-white text-sm mb-1 text-pink-300">Software Signer Failure</h4>
                  <p className="text-xs text-slate-400">
                    Client-side certificates cannot prove runtime integrity or isolate private keys from memory scraping on infected host OSs.
                  </p>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-white text-sm mb-1 text-blue-300">Hardware Root of Trust</h4>
                  <p className="text-xs text-slate-400">
                    AWS Nitro Enclaves guarantee that verification code is sealed within an isolated microVM with verified PCR0 cryptographic measurements.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: BOT Chain Advantages */}
            <section id="botchain" className="border border-slate-800 bg-slate-900/40 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Layers className="w-5 h-5" />
                <h3 className="text-xl font-bold text-white">2. BOT Chain Layer 1 Architecture</h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-4 text-sm sm:text-base">
                Proofiy is engineered natively for BOT Chain to deliver real-time, micro-cost provenance settlement:
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>
                    <strong className="text-white">Proof of Staked Authority (PoSA):</strong> Provides sub-second (~0.75s) block intervals and deterministic 2-block finality, eliminating chain reorganizations.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>
                    <strong className="text-white">Ecosystem Gas Rebates:</strong> High-frequency autonomous AI agents recover up to 80% of gas fees via the BOT Chain Ecosystem Program.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>
                    <strong className="text-white">EVM Parity & Tooling:</strong> 100% compatible with Solidity ^0.8.20, Hardhat, OpenZeppelin, and standard EVM wallets (MetaMask, BO Wallet).
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3: Smart Contracts */}
            <section id="contracts" className="border border-slate-800 bg-slate-900/40 rounded-2xl p-8">
              <div className="flex items-center gap-2 text-pink-400 mb-3">
                <Terminal className="w-5 h-5" />
                <h3 className="text-xl font-bold text-white">3. Smart Contract Verification Pipeline</h3>
              </div>
              <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
                The protocol operates three audited smart contracts working in unison:
              </p>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-blue-400">ProofRegistry.sol</span>
                    <span className="text-xs text-slate-500 font-mono">0xB766F0Ad...0261</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Validates ECDSA signatures against authorized oracle providers, verifies AWS Nitro Enclave PCR0 hardware measurements, and coordinates state transitions from Pending to Verified.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-pink-400">ProvenanceCertificate.sol</span>
                    <span className="text-xs text-slate-500 font-mono">0x1f572428...3A9B</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ERC-721 non-fungible certificate token contract (BOTCERT). Enforces atomic uniqueness to prevent duplicate claims for the same content or manifest hash.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-emerald-400">AgentIdentityRegistry.sol (ERC-8004)</span>
                    <span className="text-xs text-slate-500 font-mono">0x6f3922EF...d773</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Standardized AI Agent Identity registry. Binds autonomous wallet addresses, IPFS manifests, and minted provenance certificates into an immutable on-chain reputation portfolio.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar: Key Contract Addresses & Quick Specs */}
          <div className="space-y-6">
            <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 shadow-xl sticky top-24">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Bohr Testnet Contracts
              </h4>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <div className="text-slate-400 mb-1">ProvenanceCertificate:</div>
                  <a
                    href="https://scan.bohr.life/address/0x1f572428708e3eEB0e56277972bdFFe010Cb3A9B"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all block bg-slate-950 p-2 rounded border border-slate-800"
                  >
                    0x1f572428708e3eEB0e56277972bdFFe010Cb3A9B
                  </a>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">ProofRegistry:</div>
                  <a
                    href="https://scan.bohr.life/address/0xB766F0Ad04132b109577b31bF4a63b6462f40261"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all block bg-slate-950 p-2 rounded border border-slate-800"
                  >
                    0xB766F0Ad04132b109577b31bF4a63b6462f40261
                  </a>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">AgentIdentityRegistry (ERC-8004):</div>
                  <a
                    href="https://scan.bohr.life/address/0x6f3922EF9BcfEB1fBb3c157b1F8947b70c59d773"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all block bg-slate-950 p-2 rounded border border-slate-800"
                  >
                    0x6f3922EF9BcfEB1fBb3c157b1F8947b70c59d773
                  </a>
                </div>

                <div>
                  <div className="text-slate-400 mb-1">Deployer Account:</div>
                  <a
                    href="https://scan.bohr.life/address/0xA4A42E4873d57Dd91fA9D41D5956EA51E4D69DE9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 break-all block bg-slate-950 p-2 rounded border border-slate-800"
                  >
                    0xA4A42E4873d57Dd91fA9D41D5956EA51E4D69DE9
                  </a>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Network Parameters
                </h5>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chain ID:</span>
                    <span className="font-mono">968 (0x3c8)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Block Time:</span>
                    <span className="font-mono">~0.75 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Native Token:</span>
                    <span className="font-mono">tBOT (18 dec)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RPC Endpoint:</span>
                    <span className="font-mono">rpc.bohr.life</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-blue-500/20"
                >
                  Launch Verification App
                </Link>
                <Link
                  href="/registry"
                  className="w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  Browse Certificate Registry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
