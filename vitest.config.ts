import {defineConfig} from 'vitest/config';
import path from 'node:path';
export default defineConfig({resolve:{alias:{'@':path.resolve('.'),'server-only':path.resolve('tests/empty.ts')}},test:{include:['tests/unit/**/*.test.ts','tests/component/**/*.test.tsx','supabase/tests/**/*.test.ts'],environment:'node',testTimeout:30000,hookTimeout:60000}});
