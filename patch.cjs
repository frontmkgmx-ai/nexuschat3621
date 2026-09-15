const fs = require('fs');
const path = 'src/services/storageService.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  /export const getPublicFileUrl = \(path: string\) => \{\n  if \(\!path\) return '';\n  return path;\n\};/,
  `export const getPublicFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  if (!path.includes('firebasestorage')) return \`/api/storage/file/\${path}\`;
  return path;
};`
);
fs.writeFileSync(path, code);
