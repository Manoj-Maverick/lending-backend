// middleware/multer.js
import multer from "multer";
import path from "path";
import fs from "fs";

// 1️⃣ Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), "uploads", "tmp");
fs.mkdirSync(tmpDir, { recursive: true });

// 2️⃣ Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tmpDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

// 3️⃣ File filter (VERY IMPORTANT 🔥)
function fileFilter(req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, PDF allowed"), false);
  }

  cb(null, true);
}

// 4️⃣ Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
