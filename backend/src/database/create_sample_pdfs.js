import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createSimplePdf(title, subtitle, filename) {
  const content = `
BT
/F1 24 Tf
50 720 Td
(${title}) Tj
/F1 14 Tf
0 -36 Td
(${subtitle}) Tj
/F1 10 Tf
0 -28 Td
(Vaibhav Dhus LMS - Protected Course Engineering Resource) Tj
0 -20 Td
(Downloaded legally via Student Portal with cryptographic audit verification) Tj
ET
`;
  const streamLength = content.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream${content}endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

  const destPath = path.resolve(__dirname, '../../storage/resources', filename);
  fs.writeFileSync(destPath, pdf, 'utf-8');
  console.log(`Created resource: ${filename}`);
}

const resources = [
  {
    title: 'Architecture Blueprint & Decoupled LMS Systems',
    subtitle: 'Module 1: High Level System Design and Data Flow Cheatsheet',
    filename: 'architecture_blueprint.pdf'
  },
  {
    title: 'MySQL Indexing and Query Optimization Master Guide',
    subtitle: 'Module 2: High Performance SQL Schemas and Composite Indexing',
    filename: 'mysql_indexing_guide.pdf'
  },
  {
    title: 'Enterprise Security, Ephemeral Tokens & JWT Lifecycle',
    subtitle: 'Module 2: Anti-Account Sharing and Session Revocation Strategies',
    filename: 'jwt_security_notes.pdf'
  },
  {
    title: 'React Design Token System & Dynamic Theme Reference',
    subtitle: 'Module 3: CSS Custom Properties and Production Dark Mode Engine',
    filename: 'react_design_tokens.pdf'
  },
  {
    title: 'Complete LMS Production Launch & Scaling Checklist',
    subtitle: 'Module 4: Zero Downtime Deployment, Rate Limiting and Hardening',
    filename: 'lms_production_checklist.pdf'
  }
];

resources.forEach(r => createSimplePdf(r.title, r.subtitle, r.filename));
