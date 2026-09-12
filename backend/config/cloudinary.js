import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root ke .env ko load karega
const projectRoot = path.resolve(__dirname, '../../');

dotenv.config({
  path: path.join(projectRoot, '.env'),
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  'Cloudinary Config:',
  process.env.CLOUDINARY_API_KEY ? 'Loaded ✅' : 'Missing ❌'
);

export default cloudinary;