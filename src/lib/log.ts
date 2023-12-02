import winston from 'winston';

const LOG_LEVEL = process.env.DEBUG || 'info';
const USE_COLOR = process.env.LOG_COLOR !== 'false';

// setup logger
const myFormat = winston.format.printf((info) => {
    if (info.stack) {
        return `[${info.timestamp}] [${info.label}] ${info.level}: ${info.message} \n${info.stack}`;
    } else {
        return `[${info.timestamp}] [${info.label}] ${info.level}: ${info.message}`;
    }
});

let winstonFormat;

if (USE_COLOR) {
    winstonFormat = winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.label({ label: 'punk-bot' }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat);
} else {
    winstonFormat = winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.label({ label: 'punk-bot' }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat);
}

const logger = winston.createLogger({
    format: winstonFormat,
    transports: [
        new winston.transports.Console({ level: LOG_LEVEL }),
    ],
});

export {
    logger,
};