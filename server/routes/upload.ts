
import { Router } from 'express';
import multer from 'multer';
import { fileProcessor } from '../services/file-processor';
import fs from 'fs';
import { validateFile } from '../middlewares/file-validation';

const router = Router();

// Configure multer for temporary storage
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.array('files'), validateFile, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: 'No files uploaded.' });
    }

    const files = req.files as Express.Multer.File[];
    let extractedText = "";
    try {
      extractedText = await fileProcessor.extractTextFromMultipleFiles(files, 3);
    } catch (error: any) {
      console.error('File Processing Error:', error);
      return res.status(400).json({
        message: `Falha ao processar arquivos: ${error.message}`,
        error: error.message
      });
    }

    res.json({ extractedText });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ message: 'Erro interno ao processar arquivos.', error: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
});

export default router;
