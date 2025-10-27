import request from 'supertest';
import app from '../server/app';
import { Document, DocumentVersion } from '../server/models';

// Mock data
const mockDocument = {
  _id: '507f1f77bcf86cd799439011',
  type: 'contract',
  title: 'Test Contract',
  createdAt: new Date(),
  latestVersion: 1
};

const mockVersion = {
  document: '507f1f77bcf86cd799439011',
  version: 1,
  content: 'Test content',
  createdAt: new Date(),
  type: 'contract',
  title: 'Test Contract'
};

// Mock the database operations
jest.mock('../server/models', () => ({
  Document: {
    findById: jest.fn(),
    save: jest.fn()
  },
  DocumentVersion: {
    findOne: jest.fn(),
    save: jest.fn()
  }
}));

// Mock the AI service
jest.mock('../server/ai-service', () => ({
  generateDocument: jest.fn().mockResolvedValue('Generated content')
}));

// Test suite for document routes
describe('Document Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /documents/:documentId/versions/:versionId/edit', () => {
    it('should return 400 if content is missing', async () => {
      const res = await request(app)
        .post('/documents/507f1f77bcf86cd799439011/versions/1/edit')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Content is required');
    });

    it('should return 404 if document is not found', async () => {
      Document.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/documents/507f1f77bcf86cd799439011/versions/1/edit')
        .send({ content: 'New content' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Document not found');
    });

    it('should edit a document version successfully', async () => {
      Document.findById.mockResolvedValue(mockDocument);
      DocumentVersion.findOne.mockResolvedValue(mockVersion);
      DocumentVersion.save.mockResolvedValue(mockVersion);
      Document.save.mockResolvedValue(mockDocument);

      const res = await request(app)
        .post('/documents/507f1f77bcf86cd799439011/versions/1/edit')
        .send({ content: 'New content' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('New content');
    });
  });

  describe('POST /generate-document', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/generate-document')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Type, demand, and title are required');
    });

    it('should generate a document successfully', async () => {
      Document.save.mockResolvedValue(mockDocument);
      DocumentVersion.save.mockResolvedValue(mockVersion);

      const res = await request(app)
        .post('/generate-document')
        .send({
          type: 'contract',
          demand: 'Test demand',
          title: 'Test Contract'
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Generated content');
    });
  });
});
