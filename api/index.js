const express = require('express');
const logger = require('morgan');
const consola = require('consola');
const compression = require('compression');
const helmet = require('helmet');
const lusca = require('lusca');
const mongoose = require('mongoose');
const cors = require('cors');

/**
 * Load Middleware
 */
const cfZeroTrust = require('./middleware/cfZeroTrust');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
require('dotenv').config();

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true
});

mongoose.connection.on('error', err => {
  consola.error(err);
  consola.log(
    '%s MongoDB connection error. Please make sure MongoDB is running.'
  );
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.IP || '127.0.0.1');
app.set('port', process.env.PORT || 3030);
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
lusca.referrerPolicy('same-origin');
app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

switch (process.env.NODE_ENV) {
  case 'development':
    app.use(logger('dev'));
    break;
  case 'production':
    app.use(logger('combined'));
    app.use(
      cors({
        origin: [process.env.WEB_URI, process.env.API_URI]
      })
    );
    app.use(logger('combined'));
    app.enable('trust proxy');
    app.set('trust proxy', 1);
    break;
  default:
    app.use(logger('dev'));
}

/**
 * Primary app routes.
 */
app.use('/', require('./routes'));
app.use('/admin/import', cfZeroTrust, require('./routes/admin/import'));

/**
 * Handle 404 errors.
 */
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route not found',
    originalRoute: req.originalUrl
  });
});

/**
 * Start Express server once MongoDB connection is established.
 */
mongoose.connection.on('open', () => {
  app.listen(app.get('port'), () => {
    consola.log('----------------------------------------');
    consola.info(`Environment: ${app.get('env')}`);
    consola.info(`App URL: http://${app.get('host')}:${app.get('port')}`);
    consola.log('----------------------------------------');
  });
});

/**
 * Close MongoDB connection on app termination.
 */
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    consola.log(
      'Mongoose default connection disconnected through app termination'
    );
    process.exit(0);
  });
});

module.exports = app;
