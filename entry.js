// entry.js - Entry point for Hostinger Passenger
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Blent Boost server from entry.js...');

const child = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

child.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
});
