import type { Application } from 'jsr:@oak/oak';
import defaultRouter from './default.router.ts';
import userRouter from './user.router.ts';
import authRouter from './auth.router.ts';
import p2pRouter from './p2p.router.ts';

const init = (app: Application) => {
  app.use(authRouter.routes());
  app.use(userRouter.routes());
  app.use(p2pRouter.routes());
  app.use(defaultRouter.routes());

  app.use(authRouter.allowedMethods());
  app.use(userRouter.allowedMethods());
  app.use(p2pRouter.allowedMethods());
  app.use(defaultRouter.allowedMethods());
};

export default {
  init,
};
