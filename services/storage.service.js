// // services/storage.service.js
// import fs from "fs";
// import path from "path";

// /**
//  * Get folder path based on category
//  */
// function getFolder({ category, entity_id, loan_id }) {
//   if (category === "customer") {
//     return ["customers", String(entity_id)];
//   }

//   if (category === "guarantor") {
//     return ["guarantors", String(entity_id)];
//   }

//   if (category === "loan") {
//     return ["loans", String(loan_id)];
//   }

//   throw new Error("Invalid category");
// }

// /**
//  * Store file (LOCAL NOW)
//  * Later → replace this logic with cloud upload
//  */
// export async function storeFile({ file, category, entity_id, loan_id }) {
//   // 1️⃣ Decide folder
//   const folderParts = getFolder({ category, entity_id, loan_id });

//   const baseDir = path.join(process.cwd(), "uploads", ...folderParts);

//   // 2️⃣ Ensure directory exists
//   fs.mkdirSync(baseDir, { recursive: true });

//   // 3️⃣ Final path
//   const finalPath = path.join(baseDir, file.filename);

//   // 4️⃣ Move from tmp → final
//   fs.renameSync(file.path, finalPath);

//   // 5️⃣ Return URL-safe path
//   return finalPath.replace(process.cwd(), "").replace(/\\/g, "/");
// }

import cloudinary from "../Routes/couldinery.js";
import fs from "fs";

/**
 * Store file (CLOUDINARY VERSION)
 */
export async function storeFile({ file, category, entity_id, loan_id }) {
  try {
    // 📁 Build folder path in cloud
    let folder = "lendwid";

    if (category === "customer") {
      folder = `lendwid/customers/${entity_id}`;
    }

    if (category === "guarantor") {
      folder = `lendwid/guarantors/${entity_id}`;
    }

    if (category === "loan") {
      folder = `lendwid/loans/${loan_id}`;
    }

    console.log("Uploading local file:", file.path, "with params:", { folder });

    // ☁️ Upload to Cloudinary
    const res = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "auto",
      resource_type: "auto",
      quality: "auto:low",
      fetch_format: "auto",
      width: 1200,
      height: 1200,
      crop: "limit",
    });

    // 🧹 Delete local temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // 🔗 Return URL
    return {
      url: res.secure_url,
      public_id: res.public_id,
    };
  } catch (err) {
    // cleanup if failed
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    throw err;
  }
}
