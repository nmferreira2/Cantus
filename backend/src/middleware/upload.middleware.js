import multer from "multer";
import { AppError } from "../utils/app-error.js";

export const uploadSongDocument = singleFileUpload(10 * 1024 * 1024);
export const uploadScoreDocument = singleFileUpload(20 * 1024 * 1024);
export const uploadLogoImage = singleFileUpload(2 * 1024 * 1024);
export const uploadComposerImage = singleFileUpload(5 * 1024 * 1024);

function singleFileUpload(maximumSize) {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            files: 1,
            fileSize: maximumSize
        }
    });

    return (req, res, next) => {
        upload.single("file")(req, res, (error) => {
            if (!error) {
                return next();
            }

            if (error instanceof multer.MulterError) {
                const megabytes = maximumSize / (1024 * 1024);
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? `Os ficheiros devem ter no máximo ${megabytes} MB.`
                    : "O carregamento do ficheiro é inválido.";
                return next(new AppError(400, message));
            }

            return next(error);
        });
    };
}
