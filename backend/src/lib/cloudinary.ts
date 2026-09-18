import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";

let configured = false;

function ensureCloudinary() {
  if (configured) return;
  if (
    !env.cloudinaryCloudName ||
    !env.cloudinaryApiKey ||
    !env.cloudinaryApiSecret
  ) {
    throw new AppError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      500,
    );
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
}

function sanitizePublicId(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "").slice(0, 40);
  const safe = base.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
  return `${Date.now()}-${safe || "proof"}`;
}

export async function uploadPaymentProof(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
) {
  ensureCloudinary();

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "icape/payment-proofs",
        public_id: sanitizePublicId(fileName),
        resource_type: "auto",
      },
      (error, uploaded) => {
        if (error || !uploaded?.secure_url || !uploaded.public_id) {
          reject(
            new AppError(
              error?.message || "Failed to upload payment proof to Cloudinary",
              502,
            ),
          );
          return;
        }
        resolve({
          secure_url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
