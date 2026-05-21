// Template profissional para geração de PDF
// Inspirado no Eisvogel template

// Detecta o tipo de documento baseado no conteúdo
export function detectDocumentType(content: string): string {
  if (content.includes('📄 **Documento de Requisitos')) return 'prd';
  if (content.includes('📘 **Épico')) return 'epic';
  if (content.includes('🧩 **User Stories')) return 'userstories';
  if (content.includes('🗓️ **Roadmap')) return 'roadmap';
  if (content.includes('🚀 **Release Note')) return 'releasenote';
  if (content.includes('🎯 **Pitch')) return 'pitch';
  if (content.includes('⚙️ **Especificação Técnica')) return 'techspec';
  if (content.includes('🧪 **Plano de Testes')) return 'testplan';
  if (content.includes('📡 **Documentação de API')) return 'apidoc';
  return 'prd';
}

// Cores por tipo de documento (inspirado no Eisvogel)
export const documentThemes: Record<string, { primary: string; secondary: string; accent: string; name: string }> = {
  prd: { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#dbeafe', name: 'PRD' },
  epic: { primary: '#7c3aed', secondary: '#a78bfa', accent: '#ede9fe', name: 'Épico' },
  userstories: { primary: '#059669', secondary: '#34d399', accent: '#d1fae5', name: 'User Stories' },
  roadmap: { primary: '#0891b2', secondary: '#22d3ee', accent: '#cffafe', name: 'Roadmap' },
  releasenote: { primary: '#dc2626', secondary: '#f87171', accent: '#fee2e2', name: 'Release Note' },
  pitch: { primary: '#ea580c', secondary: '#fb923c', accent: '#ffedd5', name: 'Pitch' },
  techspec: { primary: '#374151', secondary: '#6b7280', accent: '#f3f4f6', name: 'Tech Spec' },
  testplan: { primary: '#7c2d12', secondary: '#c2410c', accent: '#fed7aa', name: 'Test Plan' },
  apidoc: { primary: '#1f2937', secondary: '#4b5563', accent: '#e5e7eb', name: 'API Doc' }
};

// Função para escapar HTML
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Gera o HTML completo para o PDF
export function generatePdfHtml(
  title: string,
  htmlContent: string,
  currentDate: string,
  theme: { primary: string; secondary: string; accent: string; name: string }
): string {
  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${theme.primary};
      --secondary: ${theme.secondary};
      --accent: ${theme.accent};
      --text: #1f2937;
      --text-light: #6b7280;
      --border: #e5e7eb;
      --bg: #ffffff;
      --bg-alt: #f9fafb;
    }

    @page {
      size: A4;
      margin: 20mm 15mm 25mm 15mm;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: var(--text);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }

    /* ========== COVER PAGE ========== */
    .cover {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, var(--primary) 0%, ${theme.secondary} 100%);
      color: white;
      padding: 60px 40px;
      position: relative;
      margin: -20mm -15mm 0 -15mm;
      width: calc(100% + 30mm);
    }

    .cover::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.3;
    }

    .cover-content {
      position: relative;
      z-index: 1;
    }

    .cover-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 30px;
      font-size: 11pt;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 30px;
      backdrop-filter: blur(10px);
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 20px;
      max-width: 600px;
    }

    .cover-subtitle {
      font-size: 12pt;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .cover-meta {
      display: flex;
      gap: 30px;
      justify-content: center;
      font-size: 10pt;
      opacity: 0.8;
    }

    .cover-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cover-logo {
      position: absolute;
      bottom: 40px;
      font-size: 14pt;
      font-weight: 600;
      letter-spacing: 2px;
      opacity: 0.7;
    }

    /* ========== CONTENT ========== */
    .content {
      padding: 30px 0 0 0;
      max-width: 100%;
    }

    /* ========== TYPOGRAPHY ========== */
    h1 {
      font-size: 18pt;
      font-weight: 700;
      color: var(--primary);
      margin: 35px 0 18px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--primary);
      page-break-after: avoid;
    }

    h2 {
      font-size: 14pt;
      font-weight: 600;
      color: var(--primary);
      margin: 28px 0 14px;
      padding-bottom: 8px;
      border-bottom: 1.5px solid var(--border);
      page-break-after: avoid;
    }

    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: var(--text);
      margin: 22px 0 10px;
      page-break-after: avoid;
    }

    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: var(--text-light);
      margin: 18px 0 8px;
    }

    p {
      margin: 12px 0;
      text-align: justify;
      hyphens: auto;
    }

    strong {
      font-weight: 600;
      color: var(--primary);
    }

    em {
      font-style: italic;
      color: var(--text-light);
    }

    a {
      color: var(--secondary);
      text-decoration: none;
      border-bottom: 1px solid var(--secondary);
    }

    /* ========== LISTS ========== */
    ul, ol {
      margin: 14px 0 14px 24px;
      padding-left: 0;
    }

    li {
      margin: 8px 0;
      padding-left: 4px;
    }

    li > ul, li > ol {
      margin: 6px 0 6px 20px;
    }

    /* ========== TABLES ========== */
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 20px 0;
      font-size: 9.5pt;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }

    thead {
      background: var(--primary);
    }

    th {
      padding: 12px 14px;
      text-align: left;
      color: white;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:nth-child(even) {
      background: var(--bg-alt);
    }

    /* ========== CODE ========== */
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 18px 0;
      overflow-x: auto;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 9pt;
      line-height: 1.5;
      page-break-inside: avoid;
    }

    code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 9pt;
      background: var(--accent);
      color: var(--primary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* ========== BLOCKQUOTE ========== */
    blockquote {
      margin: 20px 0;
      padding: 16px 24px;
      background: var(--accent);
      border-left: 4px solid var(--primary);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: var(--text);
    }

    blockquote p {
      margin: 0;
      text-align: left;
    }

    blockquote strong {
      display: block;
      margin-bottom: 4px;
      font-style: normal;
    }

    /* ========== BADGES & STATUS ========== */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 500;
    }

    .badge.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .checkbox {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: 2px solid var(--border);
      border-radius: 4px;
      margin-right: 8px;
      font-size: 11px;
      color: var(--text-light);
    }

    .checkbox.checked {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .status-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 4px;
    }

    .status-dot.red { background: #ef4444; }
    .status-dot.yellow { background: #eab308; }
    .status-dot.green { background: #22c55e; }

    /* ========== HR ========== */
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(to right, var(--primary), var(--secondary), transparent);
      margin: 30px 0;
    }

    /* ========== FOOTER ========== */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: var(--text-light);
    }

    .footer-logo {
      font-weight: 600;
      color: var(--primary);
    }

    /* ========== PRINT OPTIMIZATIONS ========== */
    @media print {
      .cover {
        margin: 0;
        width: 100%;
      }
      body {
        font-size: 10pt;
      }
      h1, h2, h3 { page-break-after: avoid; }
      table, pre, blockquote, figure { page-break-inside: avoid; }
      a { border-bottom: none; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-content">
      <div class="cover-badge">${theme.name}</div>
      <h1 class="cover-title">${escapedTitle}</h1>
      <p class="cover-subtitle">Documento gerado automaticamente</p>
      <div class="cover-meta">
        <div class="cover-meta-item">
          <span>📅</span>
          <span>${currentDate}</span>
        </div>
        <div class="cover-meta-item">
          <span>📄</span>
          <span>${theme.name}</span>
        </div>
      </div>
    </div>
    <div class="cover-logo">DOCUMENTE</div>
  </div>

  <!-- Content -->
  <div class="content">
    ${htmlContent}
  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="footer-logo">DocuMente</span>
    <span>Gerado em ${currentDate}</span>
  </div>
</body>
</html>`;
}

// Pré-processa o conteúdo markdown para adicionar estilos especiais
export function preprocessContent(content: string): string {
  return content
    .replace(/- \[x\]/gi, '<span class="checkbox checked">✓</span>')
    .replace(/- \[ \]/g, '<span class="checkbox">○</span>')
    .replace(/⚠️/g, '<span class="badge warning">⚠️</span>')
    .replace(/✅/g, '<span class="badge success">✓</span>')
    .replace(/❌/g, '<span class="badge error">✗</span>')
    .replace(/🔴/g, '<span class="status-dot red"></span>')
    .replace(/🟡/g, '<span class="status-dot yellow"></span>')
    .replace(/🟢/g, '<span class="status-dot green"></span>');
}
