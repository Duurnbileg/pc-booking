import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});

function configureCloudinary(): boolean {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return false;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return true;
}

uploadRouter.post(
  "/",
  requireAuth,
  requireRoles("CAFE_OWNER", "ADMIN"),
  upload.array("images", 8),
  async (req, res) => {
    if (!configureCloudinary()) {
      res.status(503).json({
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_URL in apps/api/.env",
      });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ error: "No images uploaded" });
      return;
    }

    try {
      const urls: string[] = [];
      for (const file of files) {
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "pc-booking/cafes", resource_type: "image" },
            (err, uploaded) => {
              if (err || !uploaded?.secure_url) {
                reject(err ?? new Error("Upload failed"));
                return;
              }
              resolve({ secure_url: uploaded.secure_url });
            },
          );
          stream.end(file.buffer);
        });
        urls.push(result.secure_url);
      }
      res.json({ urls });
    } catch (err) {
      console.error("Cloudinary upload failed", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  },
);
