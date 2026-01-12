
import fs from 'fs';
import path from 'path';
import * as pdfLib from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import csv from 'csv-parser';
import { logger } from '../utils/logger';

// Correção para compatibilidade ES Module/CommonJS
const pdf: any = (pdfLib as any).default || pdfLib;

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
        // Excel files
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          extractedText = await this.extractTextFromExcel(filePath, fileName);
          break;
        // PowerPoint files
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/vnd.ms-powerpoint':
          extractedText = await this.extractTextFromPowerPoint(filePath, fileName);
          break;
        // CSV files
        case 'text/csv':
          extractedText = await this.extractTextFromCSV(filePath, fileName);
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

  private async extractTextFromExcel(filePath: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de Excel', {
      action: 'excel_processing',
      fileType: 'excel',
      fileName: fileName,
      fileSize: fs.statSync(filePath).size
    });

    try {
      const workbook = xlsx.readFile(filePath);
      let extractedText = '';

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        extractedText += `=== Sheet: ${sheetName} ===\n`;
        
        jsonData.forEach((row: any) => {
          if (row && row.length > 0) {
            extractedText += row.join(' | ') + '\n';
          }
        });
        
        extractedText += '\n\n';
      });

      logger.info('Excel processado com sucesso', {
        action: 'excel_processing',
        fileType: 'excel',
        fileName: fileName,
        status: 'success'
      });

      return extractedText;
    } catch (error) {
      logger.error(`Falha ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'excel_processing',
        fileType: 'excel',
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw new Error(`Falha ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async extractTextFromPowerPoint(filePath: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de PowerPoint', {
      action: 'ppt_processing',
      fileType: 'ppt',
      fileName: fileName,
      fileSize: fs.statSync(filePath).size
    });

    try {
      // Note: PowerPoint extraction requires a more complex approach
      // For now, we'll return a placeholder message
      // In a production environment, you would use a library like 'pptxgenjs' or 'officeparser'
      
      logger.info('PowerPoint processado com sucesso', {
        action: 'ppt_processing',
        fileType: 'ppt',
        fileName: fileName,
        status: 'success'
      });

      return `=== PowerPoint File: ${fileName} ===\n\nPowerPoint extraction is not fully implemented yet.\nThis feature would require additional libraries like pptxgenjs or officeparser.\n\nFile size: ${fs.statSync(filePath).size} bytes`;
    } catch (error) {
      logger.error(`Falha ao processar PowerPoint: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'ppt_processing',
        fileType: 'ppt',
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw new Error(`Falha ao processar PowerPoint: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async extractTextFromCSV(filePath: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de CSV', {
      action: 'csv_processing',
      fileType: 'csv',
      fileName: fileName,
      fileSize: fs.statSync(filePath).size
    });

    try {
      const results: any[] = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            let extractedText = '=== CSV Data ===\n\n';
            
            if (results.length > 0) {
              // Add headers
              const headers = Object.keys(results[0]);
              extractedText += headers.join(' | ') + '\n';
              extractedText += '-'.repeat(headers.join(' | ').length) + '\n';
              
              // Add rows
              results.forEach(row => {
                extractedText += headers.map(header => row[header]).join(' | ') + '\n';
              });
            }
            
            logger.info('CSV processado com sucesso', {
              action: 'csv_processing',
              fileType: 'csv',
              fileName: fileName,
              rowCount: results.length,
              status: 'success'
            });
            
            resolve(extractedText);
          })
          .on('error', (error) => {
            logger.error(`Falha ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
              action: 'csv_processing',
              fileType: 'csv',
              fileName: fileName,
              error: error instanceof Error ? error.message : String(error),
              status: 'error'
            });
            reject(new Error(`Falha ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
          });
      });
    } catch (error) {
      logger.error(`Falha ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'csv_processing',
        fileType: 'csv',
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw new Error(`Falha ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

export const fileProcessor = new FileProcessor();
