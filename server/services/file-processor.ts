
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

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
    const { mimetype, path: filePath } = file;

    if (mimetype === 'application/pdf') {
      return this.extractTextFromPDF(filePath);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.extractTextFromDocx(filePath);
    } else if (mimetype === 'text/plain') {
      return this.extractTextFromTxt(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private async extractTextFromDocx(filePath: string): Promise<string> {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
  }

  private async extractTextFromTxt(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }
}

export const fileProcessor = new FileProcessor();
