
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
    let extractedText = '';

    for (const file of files) {
      try {
        const text = await fileProcessor.extractTextFromFile(file);
        extractedText += text + '\n\n';
      } catch (error: any) {
        // Tratamento específico de erros por tipo de arquivo
        if (file.mimetype === 'application/pdf') {
          console.error('PDF Processing Error:', error);
          return res.status(400).json({
            message: 'Falha ao processar arquivo PDF: arquivo corrompido ou inválido.',
            error: error.message
          });
        } else if (file.mimetype.startsWith('image/')) {
          console.error('Image Processing Error:', error);
          return res.status(400).json({
            message: 'Falha ao processar imagem.',
            error: error.message
          });
        } else {
          console.error('File Processing Error:', error);
          return res.status(400).json({
            message: `Falha ao processar arquivo ${file.originalname}: ${error.message}`,
            error: error.message
          });
        }
      } finally {
        // Clean up the uploaded file
        fs.unlinkSync(file.path);
      }
    }

    res.json({ extractedText });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ message: 'Erro interno ao processar arquivos.', error: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
});

export default router;
