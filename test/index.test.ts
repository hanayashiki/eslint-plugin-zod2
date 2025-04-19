import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../src/rules/export-zod-type.ts';

const tester = new RuleTester();

tester.run('export-zod-type', rule, {
  valid: [
    `
      export const Schema = z.object({});
      export type Schema = z.infer<typeof Schema>;
    `,
    `
      export const Schema = z.object({}).partial();
      export type Schema = z.infer<typeof Schema>;
    `,
    `
      export const a = 1;
    `,
  ],
  invalid: [
    {
      code: `export const Schema = z.object({});`,
      errors: [
        {
          messageId: 'export-zod-type',
        },
      ],
      output: `export const Schema = z.object({});\nexport type Schema = z.infer<typeof Schema>;`,
    },
    {
      code: `export const Schema = z.object({}).partial();`,
      errors: [
        {
          messageId: 'export-zod-type',
        },
      ],
      output: `export const Schema = z.object({}).partial();\nexport type Schema = z.infer<typeof Schema>;`,
    },
    {
      name: 'respect choice of semicolon',
      code: `export const Schema = z.object({}).partial()`,
      errors: [
        {
          messageId: 'export-zod-type',
        },
      ],
      output: `export const Schema = z.object({}).partial()\nexport type Schema = z.infer<typeof Schema>`,
    },
    {
      name: 'insert multiple types',
      code: `export const A = z.enum([]);export const B = z.enum([]);`,
      errors: [
        {
          messageId: 'export-zod-type',
        },
        {
          messageId: 'export-zod-type',
        },
      ],
      output: `export const A = z.enum([]);\nexport type A = z.infer<typeof A>;\nexport const B = z.enum([]);\nexport type B = z.infer<typeof B>;`,
    },
  ],
});
