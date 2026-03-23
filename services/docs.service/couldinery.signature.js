import { sign } from "crypto";
import cloudinary from "../../Routes/couldinery.js";

export const getUploadSignature = async (req, res) => {
  try {
    const { folder } = req.body;

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, upload_preset: "lendwid_preset" },
      process.env.API_SECRET,
    );

    res.json({
      timestamp,
      signature,
      api_key: process.env.API_KEY,
      cloud_name: process.env.CLOUD_NAME,
      folder,
    });

    console.log("sign", {
      timestamp,
      signature,
      api_key: process.env.API_KEY,
      cloud_name: process.env.CLOUD_NAME,
      folder,
    });
  } catch (err) {
    res.status(500).json({ error: "Signature generation failed" });
  }
};
