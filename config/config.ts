import { loadSync } from 'jsr:@std/dotenv';

const env: string = Deno.env.get('ENV') || 'development';
const envPath: string = `environments/.env.${env}`.toString();

loadSync({
  envPath,
  export: true,
});

/**
 * Configuration
 */
const config: {
  env: string;
  appName: string;
  jwtAccessExpiration: number;
  jwtRefreshExpiration: number;
  ip: string;
  host: string;
  port: number;
  protocol: string;
  dbPath: string;
  clientHost: string;
  clientPort: number;
  clientProtocol: string;
  url: string;
  clientUrl: string;
} = {
  env,
  appName: Deno.env.get('APP_NAME') as unknown as string,
  jwtAccessExpiration: Number(
    Deno.env.get('JWT_ACCESS_TOKEN_EXP'),
  ) as unknown as number,
  jwtRefreshExpiration: Number(
    Deno.env.get('JWT_REFRESH_TOKEN_EXP'),
  ) as unknown as number,
  ip: Deno.env.get('IP') as unknown as string,
  host: Deno.env.get('HOST') as unknown as string,
  port: Number(Deno.env.get('PORT') as unknown as number),
  protocol: Deno.env.get('PROTOCOL') as unknown as string,
  dbPath: Deno.env.get('DB_PATH') as unknown as string || './data/database.duckdb',
  clientHost: Deno.env.get('CLIENT_HOST') as unknown as string,
  clientPort: Number(Deno.env.get('CLIENT_PORT') as unknown as number),
  clientProtocol: Deno.env.get('CLIENT_PROTOCOL') as unknown as string,
  url: `${Deno.env.get('PROTOCOL') as unknown as string}://${Deno.env.get(
    'HOST',
  ) as unknown as string}:${Deno.env.get('PORT') as unknown as number}`,
  clientUrl: `${Deno.env.get('CLIENT_PROTOCOL') as unknown as string}://${Deno
    .env.get('CLIENT_HOST') as unknown as string}:${Deno.env.get(
      'CLIENT_PORT',
    ) as unknown as number}`,
};

export default config;
