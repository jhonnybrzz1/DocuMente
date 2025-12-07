import { Request, Response, NextFunction } from 'express';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFile = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }

  for (const file of files) {
    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: `Tipo de arquivo não suportado: ${file.mimetype}. Tipos permitidos: ${ALLOWED_TYPES.join(', ')}` 
      });
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ 
        message: `Arquivo excede o tamanho máximo permitido de ${(MAX_SIZE / 1024 / 1024)}MB: ${file.originalname}` 
      });
    }

    // Validar extensão do arquivo (segurança adicional)
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.txt'];
    
    if (!validExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        message: `Extensão de arquivo não permitida: ${fileExtension}. Extensões permitidas: ${validExtensions.join(', ')}` 
      });
    }
  }

  next();
};