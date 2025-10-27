import { Router } from 'express';
import { generateDocument } from './ai-service';
import { Document, DocumentVersion } from './models';

const router = Router();

// Existing routes...

// New route for editing document versions
router.post('/documents/:documentId/versions/:versionId/edit', async (req, res) => {
  try {
    const { documentId, versionId } = req.params;
    const { content } = req.body;

      return res.status(400).json({ error: 'Content is required' });
    }

    // Find the original document and version
    const document = await Document.findById(documentId);
      return res.status(404).json({ error: 'Document not found' });
    }

    const originalVersion = await DocumentVersion.findOne({
      document: documentId,
      version: versionId
    });

      return res.status(404).json({ error: 'Version not found' });
    }

    // Create a new version with the edited content
    const newVersion = new DocumentVersion({
      document: documentId,
      version: originalVersion.version + 1,
      content,
      createdAt: new Date(),
      type: originalVersion.type,
      title: 
    });

    await newVersion.save();

    // Update the document's latest version
    document.latestVersion = newVersion.version;
    await document.save();

    res.status(201).json(newVersion);
  } catch (error) {
    console.error('Error editing document version:', error);
    res.status(500).json({ error: 'Failed to edit document version' });
  }
});

// New route for generating documents with AI
router.post('/generate-document', async (req, res) => {
  try {
    const { type, demand, title } = req.body;

      return res.status(400).json({ error: 'Type, demand, and title are required' });
    }

    // Generate document content using AI
    const content = await generateDocument(type, demand);

    // Create a new document
    const document = new Document({
      type,
      title,
      createdAt: new Date(),
      latestVersion: 1
    });

    await document.save();

    // Create the first version
    const version = new DocumentVersion({
      document: document._id,
      version: 1,
      content,
      createdAt: new Date(),
      type,
      title
    });

    await version.save();

    res.status(201).json(version);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

export default router;
