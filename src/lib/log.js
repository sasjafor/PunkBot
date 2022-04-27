import winston from 'winston';

const logLevel = process.env.DEBUG;

// setup logger
const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `[${timestamp}] [${label}] ${level}: ${message}`;
});
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: 'punk-bot'}),
        winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
        myFormat,
    ),
    transports: [
        new winston.transports.Console({ level: logLevel }),
    ],
});

export {
    logger,
};