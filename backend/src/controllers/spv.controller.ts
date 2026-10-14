/**
 * SPV Controller – thin HTTP adapter layer.
 *
 * Each method:
 *  1. Extracts validated data from the request.
 *  2. Delegates to the service layer.
 *  3. Wraps the result in the standard ApiResponse envelope.
 *  4. Forwards any errors to the global error handler via `next(err)`.
 */
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { spvService } from "../services/spv.service";
import type { CreateSPVRecordDTO, DecryptRequestDTO } from "../types/spv.types";

export class SPVController {
  /**
   * POST /api/v1/spv/records
   * Creates a new SPV record.
   */
  async createRecord(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dto = req.body as CreateSPVRecordDTO;
      const record = await spvService.createSPVRecord(dto);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: record,
        message: "SPV record created successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/spv/records/:id
   * Retrieves a single SPV record by ID.
   * The `encryptedPayload` is NOT returned here — use the decrypt endpoint.
   */
  async getRecord(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const record = await spvService.getSPVRecord(req.params.id);
      // Strip the encrypted payload from the read response for safety.
      const { encryptedPayload: _, ...publicFields } = record as Record<
        string,
        unknown
      >;
      void _;
      res.status(StatusCodes.OK).json({
        success: true,
        data: publicFields,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/spv/records/:id/decrypt
   * Returns the `encryptedPayload` after verifying access rights.
   * For `nft_holders_only` records, this triggers an on-chain BOT Chain check.
   */
  async decryptRecord(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = req.body as DecryptRequestDTO;
      const userAddress = body.botChainAddress || body.address || body.stellarPublicKey || "";
      const encryptedPayload = await spvService.decryptSPVRecord(
        req.params.id,
        userAddress
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: { encryptedPayload },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const spvController = new SPVController();
