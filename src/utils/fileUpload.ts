import fs from 'fs';
import path from 'path';

export const deleteFile = (filePath: string): void => {
    if (filePath) {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

export const getFileUrl = (fileName: string): string => {
    if (!fileName) return '';
    return `/uploads/${fileName}`;
};
