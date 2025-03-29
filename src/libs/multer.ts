
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Define a type for the options
interface MulterOptions {
    destination: string;
    allowedFileTypes?: string[];
    maxFileSize?: number;
}

interface ExtendedMulterFile extends Express.Multer.File {
    type?: string; // Add type property
}

// Create a configurable multer middleware factory
const createMulterMiddleware = (options: MulterOptions) => {
    // if destination folder not found then create it
    if (!fs.existsSync(options.destination)) {
        fs.mkdirSync(options.destination, { recursive: true });
    }
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, options.destination);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const fileFilter = (req: Express.Request, file: ExtendedMulterFile, cb: multer.FileFilterCallback) => {
        if (options.allowedFileTypes && !options.allowedFileTypes.includes(file.mimetype || file.type!)) {
            console.log('File type not allowed')
            return cb(new Error('File type not allowed'))

        }
        cb(null, true);
    };

    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: options.maxFileSize || 1024 * 1024 * 5
        }
    });

    return upload;
};

export default createMulterMiddleware;