import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  success: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    const message = err.issues
      .slice(0, 5)
      .map((issue) => {
        const path = issue.path.filter(Boolean).join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join(" · ");
    res.status(400).json({
      success: false,
      message: message || "Validation failed",
    });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : err.message?.includes("Excel")
        ? err.message
        : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};
