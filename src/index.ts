import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import localtunnel from "localtunnel";
import { processImage } from "./image-processor";
import { html } from "./html";
import { uploadFile, readFile, getFileUrlByCid, uploadBuffer } from './services/ddc/ddc-client';
import { ddcConfig } from './config/ddc.config';
import cors from 'cors';

// Настройки туннеля
const LOCALTUNNEL_SUBDOMAIN = "heic-converterlll";
const LOCALTUNNEL_HOST = "https://processor-proxy.sook.ch/";
const LOCAL_PORT = 3030;

if (!LOCALTUNNEL_SUBDOMAIN) {
    console.log("LOCALTUNNEL_SUBDOMAIN must be set");
    process.exit(1);
}

// Создаем экземпляр Express приложения
const app = express();
app.use(express.json());

// CORS middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
}));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Настройка multer для загрузки файлов
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith('.heic')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload a HEIC file'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB лимит
    }
});

// Хранение информации о обработанных изображениях
const processedImages = new Map<string, { originalCid: string, processedCid: string }>();

// Маршрут для главной страницы
app.get("/", (_req: Request, res: Response) => {
    console.log("Serving main page");
    res.send(html);
});

// Маршрут для загрузки файла
app.post("/upload", upload.single("image"), async (req: Request, res: Response): Promise<void> => {
    console.log("Processing upload request");
    try {
        if (!req.file) {
            console.log("No file uploaded");
            res.status(400).json({ success: false, error: "No file uploaded." });
            return;
        }

        const id = Math.random().toString(36).substring(2, 15);
        console.log(`Processing file with ID: ${id}`);

        try {
            // Загружаем оригинальный файл
            console.log("Uploading original file to DDC");
            const originalUpload = await uploadFile(req.file.buffer);
            
            // Конвертируем изображение
            console.log("Converting image");
            const processedBuffer = await processImage(id, req.file.buffer);
            
            // Загружаем конвертированный файл
            console.log("Uploading converted file to DDC");
            const processedUpload = await uploadBuffer(processedBuffer, `${id}.png`);

            // Сохраняем информацию о файлах
            processedImages.set(id, {
                originalCid: originalUpload.cid,
                processedCid: processedUpload.cid
            });

            const response = {
                success: true,
                id,
                originalUrl: getFileUrlByCid(ddcConfig.bucketId, originalUpload.cid),
                processedUrl: getFileUrlByCid(ddcConfig.bucketId, processedUpload.cid)
            };

            console.log("Conversion successful", response);
            res.json(response);
        } catch (conversionError) {
            console.error('Conversion error:', conversionError);
            res.status(400).json({ 
                success: false, 
                error: "Failed to convert image. Please ensure it's a valid HEIC file." 
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: "Processing failed" });
    }
});

// Маршрут для проверки статуса обработки
app.get("/processed/:id", async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log(`Checking status for ID: ${id}`);
    
    const imageInfo = processedImages.get(id);
    
    if (!imageInfo) {
        console.log(`No image found for ID: ${id}`);
        res.status(404).json({ success: false, error: "Image not found." });
        return;
    }

    const response = {
        success: true,
        url: getFileUrlByCid(ddcConfig.bucketId, imageInfo.processedCid),
        cid: imageInfo.processedCid
    };

    console.log(`Status response for ${id}:`, response);
    res.json(response);
});

// Маршрут для скачивания обработанного изображения
app.get("/download/:id.png", async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log(`Download request for ID: ${id}`);
        
        const imageInfo = processedImages.get(id.replace('.png', ''));
        
        if (!imageInfo) {
            console.log(`No image found for download ID: ${id}`);
            res.status(404).json({ success: false, error: "Image not found" });
            return;
        }

        console.log("Fetching file from DDC");
        const fileResponse = await readFile(imageInfo.processedCid, ddcConfig.bucketId);
        const buffer = await fileResponse.arrayBuffer();
        
        console.log("Sending file to client");
        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, error: "Download failed" });
    }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Запускаем сервер
const server = app.listen(LOCAL_PORT, () => {
    console.log(`Server listening on port ${LOCAL_PORT}!`);
});

// Обработка ошибок сервера
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Запускаем туннель
const startTunnel = async () => {
    try {
        const tunnel = await localtunnel({
            subdomain: LOCALTUNNEL_SUBDOMAIN,
            host: LOCALTUNNEL_HOST,
            port: LOCAL_PORT,
        });

        console.log("Tunnel started at", tunnel.url);

        tunnel.on('error', (err) => {
            console.error('Tunnel error:', err);
        });

        tunnel.on('close', () => {
            console.log('Tunnel closed');
        });
    } catch (error) {
        console.error('Failed to start tunnel:', error);
        process.exit(1);
    }
};

startTunnel().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;