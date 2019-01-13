const envPath = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';

require('dotenv').config({ path: envPath });

const express = require('express');
const mongoose = require('mongoose');
const Youch = require('youch');
const validate = require('express-validation');
const Sentry = require('@sentry/node');
const databaseConfig = require('./config/database');
const sentryConfig = require('./config/sentry');

class App {
  constructor() {
    this.express = express();
    this.isDev = process.env.NODE_ENV !== 'production';

    this.sentry();
    this.database();
    this.middlewares();
    this.routes();
    this.exception();
  }

  sentry() {
    Sentry.init(sentryConfig);
  }

  database() {
    mongoose.connect(
      databaseConfig.uri,
      {
        useCreateIndex: true,
        useNewUrlParser: true,
      },
    );
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(Sentry.Handlers.requestHandler());
  }

  routes() {
    this.express.use(require('./routes'));
  }

  exception() {
    if (process.env.NODE_ENV === 'production') {
      this.express.use(Sentry.Handlers.errorHandler());
    }

    this.express.use(async (err, req, res, next) => {
      if (err instanceof validate.ValidationError) {
        return res.status(err.status).json(err);
      }

      if (process.env.NODE_ENV !== 'production') {
        const youch = new Youch(err, req);

        return res.json(await youch.toJSON());
      }
      return res.status(err.status || 500).json({ error: 'Internal Server Error' });
    });
  }
}

const app = new App();

module.exports = { server: app.express, app };