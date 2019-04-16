const appRoot = require('app-root-path');
const winston = require('winston');
const {createLogger, format} = winston;

// Creates new Winston logger instance 
const logger = new winston.createLogger({
   // Currently supports console and file transports 
   format: format.combine(
    format.timestamp(),
    format.json(),
  ),
   transports: [
       new winston.transports.File({
           filename: `${appRoot}/logs/app.log`,
           level: 'info',
           maxsize: 5242880,
           handleExceptions: true,
           maxFiles: 7,
       }),
       new winston.transports.Console(),
   ],
});

// Allows us to get Morgan generated output into Winston log files using stream
logger.stream = {
   write: function(message, encoding){
       logger.info(message);
   }
};

module.exports = logger;