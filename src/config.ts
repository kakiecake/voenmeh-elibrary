import { z } from 'zod';
import dotenv from 'dotenv';

const appConfigSchema = z
  .object({
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string(),
    DB_DATABASE: z.string(),
    DB_PASSWORD: z.string(),
    JWT_SECRET: z.string(),
    UPLOADS_FOLDER: z.string(),
  })
  .transform((x) => ({
    db: {
      host: x.DB_HOST,
      port: x.DB_PORT,
      user: x.DB_USER,
      password: x.DB_PASSWORD,
      database: x.DB_DATABASE,
    },
    jwtSecret: x.JWT_SECRET,
    uploadsFolder: x.UPLOADS_FOLDER,
  }));

export type AppConfig = z.infer<typeof appConfigSchema>;

export const loadConfig = (): AppConfig => {
  dotenv.config();
  return appConfigSchema.parse(process.env);
};
