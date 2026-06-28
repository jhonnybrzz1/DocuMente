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
  theme: { primary: string; secondary: string; accent: string; name: string },
  visualTheme: string = "modern"
): string {
  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
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
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* ========== THEME OVERRIDES ========== */
    ${visualTheme === 'clean' ? `
    :root {
      --primary: #1a202c;
      --secondary: #4a5568;
      --accent: #f7fafc;
      --text: #2d3748;
      --text-light: #718096;
      --border: #e2e8f0;
      --bg: #ffffff;
      --bg-alt: #fafdff;
      --font-family: 'Georgia', 'Times New Roman', serif;
    }
    h1, h2, h3, h4, .document-title {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-weight: 600;
    }
    ` : ''}

    ${visualTheme === 'slate' ? `
    :root {
      --primary: #0f172a;
      --secondary: #475569;
      --accent: #f1f5f9;
      --text: #1e293b;
      --text-light: #64748b;
      --border: #cbd5e1;
      --bg: #ffffff;
      --bg-alt: #f8fafc;
      --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    h1, h2, h3, h4 {
      font-family: 'Segoe UI', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    ` : ''}

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-family);
      font-size: 10.5pt;
      line-height: 1.5;
      color: var(--text);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }

    .document-header {
      border-bottom: 2px solid var(--primary);
      margin-bottom: 24px;
      padding-bottom: 14px;
      ${visualTheme === 'clean' ? 'border-bottom-width: 1px;' : ''}
    }

    .document-kicker {
      color: var(--primary);
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .document-title {
      border: 0;
      color: var(--text);
      font-size: 22pt;
      line-height: 1.18;
      margin: 0 0 10px;
      padding: 0;
    }

    .document-meta {
      color: var(--text-light);
      display: flex;
      gap: 16px;
      font-size: 9pt;
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

    ${visualTheme === 'slate' ? `
    .cover {
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
    }
    ` : ''}

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
      padding: 0;
      max-width: 100%;
    }

    /* ========== TYPOGRAPHY ========== */
    h1 {
      font-size: 18pt;
      font-weight: 700;
      color: var(--primary);
      margin: 26px 0 14px;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--primary);
      page-break-after: avoid;
      ${visualTheme === 'clean' ? 'border-bottom-width: 1px;' : ''}
    }

    h2 {
      font-size: 14pt;
      font-weight: 600;
      color: var(--primary);
      margin: 22px 0 12px;
      padding-bottom: 8px;
      border-bottom: 1.5px solid var(--border);
      page-break-after: avoid;
    }

    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: var(--text);
      margin: 18px 0 8px;
      page-break-after: avoid;
    }

    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: var(--text-light);
      margin: 18px 0 8px;
    }

    p {
      margin: 9px 0;
      text-align: left;
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
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: auto;
      table-layout: fixed;
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
      letter-spacing: 0.03em;
      overflow-wrap: anywhere;
    }

    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      overflow-wrap: anywhere;
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
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 9pt;
      line-height: 1.5;
      page-break-inside: avoid;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
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
      height: 1px;
      background: var(--border);
      margin: 24px 0;
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
  ${visualTheme !== 'clean' ? `
  <div class="cover">
    <div class="cover-content">
      <div class="cover-badge">${theme.name}</div>
      <h1 class="cover-title">${escapedTitle}</h1>
      <p class="cover-subtitle">Documentação de Produto Gerada por Inteligência Artificial</p>
      <div class="cover-meta">
        <div class="cover-meta-item">
          <span>Criado em:</span>
          <strong>${currentDate}</strong>
        </div>
        <div class="cover-meta-item">
          <span>Plataforma:</span>
          <strong>DocuMente</strong>
        </div>
      </div>
    </div>
    <div class="cover-logo">DocuMente</div>
  </div>
  ` : ''}

  <div class="document-header">
    <div class="document-kicker">${theme.name}</div>
    <h1 class="document-title">${escapedTitle}</h1>
    <div class="document-meta">
      <span>Gerado em ${currentDate}</span>
      <span>DocuMente</span>
    </div>
  </div>

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
