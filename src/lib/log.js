import winston from 'winston';

const LOG_LEVEL = process.env.DEBUG || 'info';

// setup logger
const myFormat = winston.format.printf((info) => {
    if (info.stack) {
        return `[${info.timestamp}] [${info.label}] ${info.level}: ${info.message} \n${info.stack}`;
    } else {
        return `[${info.timestamp}] [${info.label}] ${info.level}: ${info.message}`;
    }
});
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.label({ label: 'punk-bot' }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat,
    ),
    transports: [
        new winston.transports.Console({ level: LOG_LEVEL }),
    ],
});

export {
    logger,
};