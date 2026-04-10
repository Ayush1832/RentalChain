import multer from 'multer';
import path from 'path';

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');

const storage = multer.memoryStorage();

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error(`File type ${ext} not allowed`), { code: 'INVALID_FILE_TYPE', statusCode: 400 }));
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter,
});
