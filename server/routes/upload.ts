
import { Router } from 'express';
import multer from 'multer';
import { fileProcessor } from '../services/file-processor';
import fs from 'fs';

const router = Router();

// Configure multer for temporary storage
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: 'No files uploaded.' });
    }

    const files = req.files as Express.Multer.File[];
    let extractedText = '';

    for (const file of files) {
      try {
        const text = await fileProcessor.extractTextFromFile(file);
        extractedText += text + '\n\n';
      } finally {
        // Clean up the uploaded file
        fs.unlinkSync(file.path);
      }
    }

    res.send({ extractedText });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).send({ message: 'Error processing files.' });
  }
});

export default router;
