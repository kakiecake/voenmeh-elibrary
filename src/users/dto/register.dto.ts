import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(32),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
