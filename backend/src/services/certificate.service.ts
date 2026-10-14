import mongoose from 'mongoose';
import Certificate, { ICertificate } from '../models/Certificate.model';
import { IVerificationJob } from '../models/VerificationJob.model';

export interface CreateCertificateInput {
  verificationJob: IVerificationJob;
  transactionHash: string;
  certificateId: string;
  contractAddress: string;
  blockNumber?: number;
  ledgerSequence?: number;
  mintedAt: Date;
  botChainNetwork?: 'testnet' | 'mainnet';
  stellarNetwork?: 'testnet' | 'mainnet';
}

export class CertificateService {
  async getCertificateById(id: string): Promise<ICertificate | null> {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { certificateId: id }] }
      : { certificateId: id };

    return Certificate.findOne(query).populate('manifestId').populate('assetId').exec();
  }

  async createFromVerificationJob(input: CreateCertificateInput): Promise<ICertificate> {
    const existingCertificate = await Certificate.findOne({
      verificationJobId: input.verificationJob.id,
    }).exec();

    if (existingCertificate) {
      return existingCertificate;
    }

    const network = input.botChainNetwork || input.stellarNetwork || 'testnet';
    const blockNum = input.blockNumber ?? input.ledgerSequence ?? 0;

    return Certificate.create({
      verificationJobId: input.verificationJob.id,
      assetId: input.verificationJob.assetId,
      manifestId: input.verificationJob.manifestId,
      creatorId: input.verificationJob.creatorId,
      botChainNetwork: network,
      stellarNetwork: network,
      contractAddress: input.contractAddress,
      certificateId: input.certificateId,
      transactionHash: input.transactionHash,
      blockNumber: blockNum,
      ledgerSequence: blockNum,
      mintedAt: input.mintedAt,
    });
  }
}

export const certificateService = new CertificateService();
