// Unlike everything in routes.config.js, this route is NOT proxied to a
// downstream service — it's real gateway-owned logic, same category as
// /health. The gateway is the only thing in this stack holding AWS
// credentials (via IRSA in-cluster, or a scoped IAM user's keys locally);
// catalog-service never touches S3.

const express = require("express");
const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();
const s3 = new S3Client({ region: process.env.AWS_REGION });

// No requireRole middleware exists in this gateway — every other route
// defers role checks to the downstream service. This is the one place the
// gateway itself needs to gate on role, since there's no "downstream" for
// an S3 presign request to defer to.
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "admin role required" });
  }
  return next();
}

router.post("/presign", authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: "filename and contentType are required" });
    }

    const key = `products/${crypto.randomUUID()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.PRODUCT_IMAGES_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const fileUrl = `https://${process.env.PRODUCT_IMAGES_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, key, fileUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
