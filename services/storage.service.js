// services/storage.service.js
import fs from "fs";
import path from "path";

/**
 * Get folder path based on category
 */
function getFolder({ category, entity_id, loan_id }) {
  if (category === "customer") {
    return ["customers", String(entity_id)];
  }

  if (category === "guarantor") {
    return ["guarantors", String(entity_id)];
  }

  if (category === "loan") {
    return ["loans", String(loan_id)];
  }

  throw new Error("Invalid category");
}

/**
 * Store file (LOCAL NOW)
 * Later → replace this logic with cloud upload
 */
export async function storeFile({ file, category, entity_id, loan_id }) {
  // 1️⃣ Decide folder
  const folderParts = getFolder({ category, entity_id, loan_id });

  const baseDir = path.join(process.cwd(), "uploads", ...folderParts);

  // 2️⃣ Ensure directory exists
  fs.mkdirSync(baseDir, { recursive: true });

  // 3️⃣ Final path
  const finalPath = path.join(baseDir, file.filename);

  // 4️⃣ Move from tmp → final
  fs.renameSync(file.path, finalPath);

  // 5️⃣ Return URL-safe path
  return finalPath.replace(process.cwd(), "").replace(/\\/g, "/");
}
