const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'BlentLandingPage.tsx');

let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-\[#060608\]/g, 'bg-[#06060f]');
content = content.replace(/bg-\[#D4FF57\]\/10/g, 'bg-violet-500/10');
content = content.replace(/bg-\[#D4FF57\]\/5/g, 'bg-violet-500/5');
content = content.replace(/bg-\[#D4FF57\]/g, 'bg-violet-600');
content = content.replace(/text-\[#D4FF57\]\/5/g, 'text-violet-500/5');
content = content.replace(/text-\[#D4FF57\]/g, 'text-violet-400');
content = content.replace(/border-\[#D4FF57\]\/10/g, 'border-violet-500/10');
content = content.replace(/border-\[#D4FF57\]\/20/g, 'border-violet-500/20');
content = content.replace(/border-\[#D4FF57\]\/30/g, 'border-violet-500/30');
content = content.replace(/border-\[#D4FF57\]/g, 'border-violet-500');
content = content.replace(/rgba\(212,255,87,/g, 'rgba(139,92,246,'); // violet-500
content = content.replace(/rgba\(87,255,212,/g, 'rgba(217,70,239,'); // fuchsia-500
content = content.replace(/selection:bg-\[#D4FF57\]\/30/g, 'selection:bg-violet-500/30');
content = content.replace(/selection:text-\[#D4FF57\]/g, 'selection:text-violet-200');
content = content.replace(/from-\[#57FFD4\] via-\[#D4FF57\] to-\[#57FFD4\]/g, 'from-purple-500 via-violet-500 to-purple-500');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Colors replaced successfully!');
