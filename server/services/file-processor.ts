
import fs from 'fs';
import path from 'path';
import { PDFParse, VerbosityLevel } from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import csv from 'csv-parser';
import { OfficeParser } from 'officeparser';
import { logger } from '../utils/logger';
import { getOpenRouterApiKey, chatCompletion, type ChatMessage } from './openrouter';

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
        case 'image/png':
        case 'image/jpeg':
        case 'image/jpg':
          extractedText = await this.extractTextFromImage(filePath, mimetype, fileName);
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
        // Audio files (Whisper)
        case 'audio/mpeg':
        case 'audio/mp3':
        case 'audio/wav':
        case 'audio/webm':
        case 'audio/ogg':
        case 'audio/x-m4a':
        case 'audio/m4a':
        case 'audio/mp4':
          extractedText = await this.extractTextFromAudio(filePath, mimetype, fileName);
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

    try {
      logger.info('Iniciando processamento de PDF', {
        action: 'pdf_processing',
        fileType: 'pdf',
        fileSize: dataBuffer.length,
        fileName: fileName
      });

      // Usando a nova API do pdf-parse v2 - passar dados no construtor
      const pdfParser = new PDFParse({
        data: new Uint8Array(dataBuffer),
        verbosity: VerbosityLevel.ERRORS
      });
      const textResult = await pdfParser.getText();
      const text = textResult.text || '';

      // Limpar recursos
      await pdfParser.destroy();

      logger.info('PDF processado com sucesso', {
        action: 'pdf_processing',
        fileType: 'pdf',
        fileSize: dataBuffer.length,
        fileName: fileName,
        status: 'success'
      });

      return text;
    } catch (error) {
      console.error('PDF Processing Error:', error);
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
        
        const limit = 100;
        const rowsToRender = jsonData.slice(0, limit);
        rowsToRender.forEach((row: any) => {
          if (row && row.length > 0) {
            extractedText += row.join(' | ') + '\n';
          }
        });
        if (jsonData.length > limit) {
          extractedText += `\n... (outras ${jsonData.length - limit} linhas da planilha Excel foram omitidas para otimizar o tamanho do contexto da IA)\n`;
        }
        
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
      // Usar officeparser v6 para extrair texto do PowerPoint
      const ast = await OfficeParser.parseOffice(filePath);
      const extractedText = ast.toText();

      const formattedText = `=== PowerPoint: ${fileName} ===\n\n${extractedText}`;

      logger.info('PowerPoint processado com sucesso', {
        action: 'ppt_processing',
        fileType: 'ppt',
        fileName: fileName,
        status: 'success'
      });

      return formattedText;
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
              const limit = 100;
              const rowsToRender = results.slice(0, limit);
              rowsToRender.forEach(row => {
                extractedText += headers.map(header => row[header]).join(' | ') + '\n';
              });
              if (results.length > limit) {
                extractedText += `\n... (outras ${results.length - limit} linhas do arquivo CSV foram omitidas para otimizar o tamanho do contexto da IA)\n`;
              }
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

  private async extractTextFromAudio(filePath: string, mimetype: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de áudio com Whisper', {
      action: 'audio_processing',
      fileType: mimetype,
      fileName: fileName,
      fileSize: fs.statSync(filePath).size
    });

    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured on the server. Não é possível transcrever o áudio.');
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      // Criar Blob nativo (Node 18+) para enviar via FormData
      const blob = new Blob([fileBuffer], { type: mimetype });
      const formData = new FormData();
      formData.append('file', blob, fileName || 'audio.mp3');
      formData.append('model', 'openai/whisper-large-v3');

      const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API OpenRouter (Whisper): ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as { text: string };
      
      logger.info('Áudio processado com sucesso via Whisper', {
        action: 'audio_processing',
        fileName: fileName,
        status: 'success'
      });

      return data.text || '';
    } catch (error) {
      logger.error(`Falha ao processar áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'audio_processing',
        fileType: mimetype,
        fileName: fileName,
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      });
      throw error;
    }
  }

  private async extractTextFromImage(filePath: string, mimetype: string, fileName?: string): Promise<string> {
    logger.info('Iniciando processamento de imagem via IA Multimodal', {
      action: 'image_processing',
      fileType: mimetype,
      fileName: fileName
    });

    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured. Não é possível processar imagens.');
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Image = fileBuffer.toString('base64');
      const dataUrl = `data:${mimetype};base64,${base64Image}`;

      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Você é um assistente OCR de alta fidelidade. Transcreva ou extraia todo o texto, tabelas, fatos, regras e dados visíveis desta imagem de forma limpa, direta e sem comentários externos.'
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ] as any
        }
      ];

      const text = await chatCompletion(messages, {
        model: "deepseek/deepseek-flash",
        temperature: 0.1,
        taskName: "quick-action"
      });

      logger.info('Imagem processada com sucesso via IA', {
        action: 'image_processing',
        fileName: fileName,
        status: 'success'
      });

      return text;
    } catch (error) {
      logger.error(`Falha ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        action: 'image_processing',
        fileType: mimetype,
        fileName: fileName,
        status: 'error'
      });
      throw error;
    }
  }

  /**
   * Extrai texto de múltiplos arquivos concorrentemente com limite de concorrência e cleanup
   * @param files - Lista de arquivos Express.Multer.File
   * @param concurrencyLimit - Limite de concorrência (padrão: 3)
   * @returns Texto unificado extraído de todos os arquivos
   */
  async extractTextFromMultipleFiles(
    files: Express.Multer.File[],
    concurrencyLimit: number = 3
  ): Promise<string> {
    const results: string[] = new Array(files.length);
    let index = 0;
    let hasError = false;
    let errorObj: any = null;

    const worker = async () => {
      while (index < files.length && !hasError) {
        const currentIndex = index++;
        const file = files[currentIndex];
        try {
          const text = await this.extractTextFromFile(file);
          results[currentIndex] = text;
        } catch (error: any) {
          hasError = true;
          errorObj = { file, error };
        } finally {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (unlinkErr) {
              console.error("Falha ao apagar arquivo temporário no processor:", unlinkErr);
            }
          }
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrencyLimit, files.length) },
      worker
    );
    await Promise.all(workers);

    if (hasError && errorObj) {
      throw errorObj.error;
    }

    return results.filter(Boolean).join('\n\n');
  }
}

export const fileProcessor = new FileProcessor();
