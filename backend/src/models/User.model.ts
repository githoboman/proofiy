import mongoose, { Schema, Document } from 'mongoose';

/**
 * User Interface
 * Represents a creator, developer, or platform interacting with BOT Chain Proof.
 */
export interface IUser extends Document {
  email: string;               // Primary identifier for Web2 login
  passwordHash: string;        // Hashed password
  
  // Password Reset Flow
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  botChainAddress?: string;    // EVM address on BOT Chain (0x...)
  stellarPublicKey?: string;   // Legacy fallback
  nonce?: string;              // For SIWE (Sign-In With Ethereum/BOT Chain)
  role: 'creator' | 'developer' | 'admin';
  apiKeys: string[];           // For developer API access
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    botChainAddress: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stellarPublicKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    nonce: {
      type: String,
    },
    role: {
      type: String,
      enum: ['creator', 'developer', 'admin'],
      default: 'creator',
    },
    apiKeys: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
