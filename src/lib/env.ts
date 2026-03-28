import { z } from 'zod';

/**
 * Environment Variable Validation
 * Validates required environment variables at runtime
 * Prevents the app from starting with invalid configuration
 */

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .describe('Backend API base URL'),

  NEXT_PUBLIC_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development')
    .describe('Application environment'),
});

// Validate and export environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration. Please check your .env file.');
    }
    throw error;
  }
}

export const env = validateEnv();

// Type-safe environment object
export type Env = z.infer<typeof envSchema>;
