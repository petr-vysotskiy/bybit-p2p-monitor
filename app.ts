import { Application } from 'jsr:@oak/oak';
import { oakCors } from 'jsr:@tajpouria/cors';
import { errorHandler } from './middlewares/errorHandler.middleware.ts';
import log from './middlewares/logger.middleware.ts';
import configs from './config/config.ts';
import router from './routers/index.ts';

const { env, url, port, clientUrl } = configs;

const app: Application = new Application();

const corsOptions = {
  'origin': [clientUrl, 'http://localhost:5174', 'http://localhost:5173'],
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false,
  'optionsSuccessStatus': 200,
  'credentials': true,
};

app.use(oakCors(corsOptions));
app.use(errorHandler);

router.init(app);

app.addEventListener('listen', () => {
  log.info(`Current Environment: ${env}`);
  log.info(`Server listening at ${url}`);
});

if (import.meta.main) {
  await app.listen({ port });
}

export { app };
