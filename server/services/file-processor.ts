
import fs from 'fs';
import path from 'path';
import * as pdfLib from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../utils/logger';

// Alias para manter a compatibilidade
const pdf = pdfLib.default || pdfLib;

/**
 * Classe responsável por processar arquivos e extrair textos de diferentes formatos
 */
class FileProcessor {
  /**
   * Extrai texto de um arquivo baseado em seu tipo MIME
   * @param file - Arquivo a ser processado
   * @returns Texto extraído do arquivo
   */
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const { mimetype, path: filePath, originalname: fileName, size: fileSize } = file;

    logger.info('Iniciando processamento de arquivo', {
      action: 'file_processing',
      fileType: mimetype,
      fileName: fileName,
      fileSize: fileSize
    });

    try {
      let extractedText: string;

      switch (mimetype) {
        case 'application/pdf':
          extractedText = await this.extractTextFromPDF(filePath, fileName);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.extractTextFromDocx(filePath, fileName);
          break;
        case 'text/plain':
          extractedText = await this.extractTextFromTxt(filePath, fileName);
          break;
        default:
          logger.error(`Tipo de arquivo não suportado: ${mimetype}`, {
            action: 'file_processing',
            fileType: mimetype,
            fileName: fileName,
            status: 'error'
          });
          throw new Error(`Unsupported file type: ${mimetype}`);
      }

      logger.info('Arquivo processado com sucesso', {
        action: 'file_processing',
        fileType: mimetype,
        fileName: fileName,
        fileSize: fileSize,
        status: 'success'
      });

      return extractedText;
    } catch (error) {
      logger.error(`Falha ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'file_processing',
        fileType: mimetype,
        fileName: fileName,
        fileSize: fileSize,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw error;
    }
  }

  private async extractTextFromPDF(filePath: string, fileName?: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);

    // Verificar se o arquivo PDF está corrompido ou é um PDF inválido
    try {
      // Verificando se é um PDF válido pelo cabeçalho
      const header = dataBuffer.subarray(0, 5).toString();
      if (header !== '%PDF-') {
        logger.error('Arquivo PDF inválido: cabeçalho não encontrado', {
          action: 'pdf_processing',
          fileType: 'pdf',
          fileSize: dataBuffer.length,
          fileName: fileName
        });
        throw new Error('Arquivo PDF inválido: cabeçalho não encontrado');
      }

      logger.info('Iniciando processamento de PDF', {
        action: 'pdf_processing',
        fileType: 'pdf',
        fileSize: dataBuffer.length,
        fileName: fileName
      });

      const data = await pdf(dataBuffer);

      logger.info('PDF processado com sucesso', {
        action: 'pdf_processing',
        fileType: 'pdf',
        fileSize: dataBuffer.length,
        fileName: fileName,
        status: 'success'
      });

      return data.text;
    } catch (error) {
      logger.error(`Falha ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'pdf_processing',
        fileType: 'pdf',
        fileSize: fs.statSync(filePath).size,
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw new Error(`Falha ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async extractTextFromDocx(filePath: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de DOCX', {
      action: 'docx_processing',
      fileType: 'docx',
      fileName: fileName,
      fileSize: fs.statSync(filePath).size
    });

    try {
      const { value } = await mammoth.extractRawText({ path: filePath });

      logger.info('DOCX processado com sucesso', {
        action: 'docx_processing',
        fileType: 'docx',
        fileName: fileName,
        status: 'success'
      });

      return value;
    } catch (error) {
      logger.error(`Falha ao processar DOCX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'docx_processing',
        fileType: 'docx',
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw new Error(`Falha ao processar DOCX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async extractTextFromTxt(filePath: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de TXT', {
      action: 'txt_processing',
      fileType: 'txt',
      fileName: fileName,
      fileSize: fs.statSync(filePath).size
    });

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      logger.info('TXT processado com sucesso', {
        action: 'txt_processing',
        fileType: 'txt',
        fileName: fileName,
        status: 'success'
      });

      return content;
    } catch (error) {
      logger.error(`Falha ao processar TXT: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'txt_processing',
        fileType: 'txt',
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw new Error(`Falha ao processar TXT: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export const fileProcessor = new FileProcessor();
