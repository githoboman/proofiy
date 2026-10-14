import mongoose, { Schema, Document } from 'mongoose';

/**
 * VerificationJob Interface
 * Tracks the lifecycle of a verification request from off-chain storage
 * through the TEE Oracle to on-chain BOT Chain certification.
 */
export interface IVerificationJob extends Document {
  creatorId: mongoose.Types.ObjectId;  // User who initiated
  assetId: mongoose.Types.ObjectId;    // The media asset being verified
  manifestId: mongoose.Types.ObjectId; // The manifest associated with the asset
  status: 'pending' | 'processing' | 'tee_verifying' | 'minting' | 'completed' | 'failed';
  
  // TEE Specific Data (Populated by Oracle Worker)
  teeAttestationHash?: string;
  teeSignature?: string;
  codeMeasurementHash?: string;
  
  // Blockchain Data
  botChainTransactionHash?: string; // The tx hash where the BOT Chain contract was called
  stellarTransactionHash?: string;  // Legacy alias
  
  errorMessage?: string;
  webhookUrl?: string;             // Optional callback for developers
  createdAt: Date;
  updatedAt: Date;
}

const VerificationJobSchema: Schema = new Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    manifestId: {
      type: Schema.Types.ObjectId,
      ref: 'Manifest',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'tee_verifying', 'minting', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    teeAttestationHash: {
      type: String,
    },
    teeSignature: {
      type: String,
    },
    codeMeasurementHash: {
      type: String,
    },
    botChainTransactionHash: {
      type: String,
    },
    stellarTransactionHash: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    webhookUrl: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model<IVerificationJob>('VerificationJob', VerificationJobSchema);
