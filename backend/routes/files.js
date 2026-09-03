import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

// File filter (PDF, PNG, JPG, JPEG)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, PNG, and JPG images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. POST Single File Upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { category, relatedId, relatedType } = req.body;
    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    // Record in FileUpload table
    const dbFile = await prisma.fileUpload.create({
      data: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
        fileType: ext,
        fileSize: req.file.size,
        category: category || 'GENERAL',
        uploadedById: req.user.id,
        relatedId: relatedId ? parseInt(relatedId) : null,
        relatedType: relatedType || null
      }
    });

    res.json({
      message: 'File uploaded successfully',
      file: dbFile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET Download / Serve Document
router.get('/download/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Requested file not found on server.' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
