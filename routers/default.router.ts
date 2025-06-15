import { Context, Router, send } from 'jsr:@oak/oak';
import configs from '../config/config.ts';

const router = new Router();

router.get('/(.*)', async (context: Context) => {
  if (configs.env === 'production') {
    const path = context.request.url.pathname;
    let resource = path;
    const options = { root: `${Deno.cwd()}/frontend/dist` };
    
    // For root path, serve index.html
    if (path === '/') {
      resource = '/index.html';
    }
    // If requesting a file with extension, serve it directly
    // Otherwise, serve index.html (for SPA routing)
    else if (!path.includes('.') && path !== '/') {
      resource = '/index.html';
    }
    
    try {
      await send(context, resource, options);
    } catch (error) {
      // If file not found, serve index.html for SPA routing
      await send(context, '/index.html', options);
    }
  } else {
    context.response.status = 200;
    context.response.body = 'ready';
  }
});

export default router;
