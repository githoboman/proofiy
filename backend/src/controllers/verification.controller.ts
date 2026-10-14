/**
 * Verification Controller – thin HTTP adapter layer.
 *
 * Each method:
 *  1. Extracts validated data from the request.
 *  2. Delegates to the verification service.
 *  3. Wraps the result in the standard ApiResponse envelope.
 *  4. Forwards any errors to the global error handler via `next(err)`.
 */
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { verificationService } from "../services/verification.service";
import { HttpError } from "../utils/httpError";
import type {
  CreateVerificationJobDTO,
  UpdateVerificationStatusDTO,
} from "../types/verification.types";

export class VerificationController {
  /**
   * POST /api/v1/verification/jobs
   * Creates a new VerificationJob in the `pending` state.
   */
  async createJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto = req.body as CreateVerificationJobDTO;
      const job = await verificationService.createJob(dto);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: job,
        message: "Verification job created successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/verification/jobs/:id
   * Retrieves a single VerificationJob by its MongoDB ObjectId.
   */
  async getJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const job = await verificationService.getJob(req.params.id);
      res.status(StatusCodes.OK).json({
        success: true,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/verification/jobs?ownerPublicKey=0x...
   * Lists all VerificationJobs belonging to the given owner.
   */
  async listJobsByOwner(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { ownerPublicKey } = req.query as { ownerPublicKey: string };
      const jobs = await verificationService.getJobsByOwner(ownerPublicKey);
      res.status(StatusCodes.OK).json({
        success: true,
        data: jobs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/verification/jobs/:id/status
   * Advances a VerificationJob to the requested status.
   */
  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto = req.body as UpdateVerificationStatusDTO;
      const job = await verificationService.updateJobStatus(
        req.params.id,
        dto
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: job,
        message: `Verification job transitioned to '${job.status}'`,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const verificationController = new VerificationController();

interface MintCallbackRequestBody {
  transactionHash?: string;
  botChainTransactionHash?: string;
  certificateId?: string;
  contractAddress?: string;
  blockNumber?: number;
  ledgerSequence?: number;
  mintedAt?: string;
  botChainNetwork?: 'testnet' | 'mainnet';
  stellarNetwork?: 'testnet' | 'mainnet';
}

export const handleMintCallback = async (
  req: Request<{ jobId: string }, unknown, MintCallbackRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new HttpError(400, 'Invalid job id');
    }

    const {
      transactionHash,
      botChainTransactionHash,
      certificateId,
      contractAddress,
      blockNumber,
      ledgerSequence,
      mintedAt,
      botChainNetwork,
      stellarNetwork
    } = req.body;

    const txHash = transactionHash || botChainTransactionHash;
    if (!txHash || !txHash.trim()) {
      throw new HttpError(400, 'transactionHash is required');
    }

    if (!certificateId || !certificateId.trim()) {
      throw new HttpError(400, 'certificateId is required');
    }

    if (!contractAddress || !contractAddress.trim()) {
      throw new HttpError(400, 'contractAddress is required');
    }

    const blockNum = blockNumber ?? ledgerSequence ?? 1;

    const net = botChainNetwork || stellarNetwork;
    if (net && net !== 'testnet' && net !== 'mainnet') {
      throw new HttpError(400, 'network must be either testnet or mainnet');
    }

    const mintedAtDate = mintedAt ? new Date(mintedAt) : new Date();
    if (Number.isNaN(mintedAtDate.getTime())) {
      throw new HttpError(400, 'mintedAt must be a valid ISO date');
    }

    const result = await verificationService.handleMintCallback({
      jobId,
      transactionHash: txHash.trim(),
      certificateId: certificateId.trim(),
      contractAddress: contractAddress.trim(),
      ledgerSequence: blockNum,
      mintedAt: mintedAtDate,
      stellarNetwork: net,
    });

    res.status(200).json({
      status: 'success',
      message: 'Verification job completed and certificate cache created on BOT Chain',
      data: {
        verificationJob: result.verificationJob,
        certificate: result.certificate,
        webhookDispatched: result.webhookDispatched,
      },
    });
  } catch (error) {
    next(error);
  }
};
