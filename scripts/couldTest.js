// import cloudinary from "../Routes/couldinery.js";
// async function test() {
//   try {
//     const res = await cloudinary.uploader.upload("https://picsum.photos/200");

//     console.log("✅ SUCCESS:", res.secure_url);
//   } catch (err) {
//     console.error("❌ ERROR:", err.message);
//   }
// }

// test();

// scripts/cloudTest.js

// scripts/cloudTest.js

import cloudinary from "../Routes/couldinery.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ✅ Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  try {
    // 📁 Use file from SAME folder as script
    const filePath = path.join(__dirname, "file.png");

    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found:", filePath);
      return;
    }

    console.log("Uploading:", filePath);

    const res = await cloudinary.uploader.upload(filePath, {
      folder: "lendwid/test",
      resource_type: "auto",
    });

    console.log("✅ SUCCESS:");
    console.log(res.secure_url);
  } catch (err) {
    console.error("❌ ERROR FULL:", err);
  }
}

test();
