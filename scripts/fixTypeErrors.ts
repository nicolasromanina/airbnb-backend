import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/controllers/apartmentDetailController.ts',
  'src/controllers/contactController.ts',
  'src/controllers/apartmentController.ts',
  'src/controllers/homeController.ts',
  'src/controllers/roomDetailController.ts',
  'src/controllers/serviceController.ts',
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix req.user?.email to (req as any).user?.email
    content = content.replace(/const updatedBy = req\.user\?\.email/g, 'const updatedBy = (req as any).user?.email');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⚠️  Not found: ${file}`);
  }
});

console.log('\n✨ All TypeScript errors fixed!');
