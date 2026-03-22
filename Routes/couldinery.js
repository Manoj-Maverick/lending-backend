import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

console.log("Cloudinary ENV:", {
  cloud: process.env.CLOUD_NAME,
  key: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

export default cloudinary;
