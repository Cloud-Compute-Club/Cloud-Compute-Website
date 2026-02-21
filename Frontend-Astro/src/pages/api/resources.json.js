import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export async function GET() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'resources.js');
    let content = fs.readFileSync(filePath, 'utf8');
    return new Response(content, {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' }
    });
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const filePath = path.join(process.cwd(), 'src', 'data', 'resources.js');

        const fileContent = `export const providers = ${JSON.stringify(body.providers, null, 4)};\n\nexport const featuredResources = ${JSON.stringify(body.featuredResources, null, 4)};\n`;

        fs.writeFileSync(filePath, fileContent);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
