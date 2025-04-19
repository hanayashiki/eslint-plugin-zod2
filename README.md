# eslint-plugin-zod2

An ESLint plugin to enforce rules using Zod.

## Installation

Install with [pnpm](https://pnpm.io):

```sh
pnpm add -D eslint-plugin-zod2
```

Or with npm:

```sh
npm install --save-dev eslint-plugin-zod2
```

Or with yarn:

```sh
yarn add --dev eslint-plugin-zod2
```

## Usage

Add `zod2` to the plugins section of your ESLint configuration and enable the rule:

```json
{
  "plugins": ["zod2"],
  "rules": {
    "zod2/export-zod-type": "error"
  }
}
```

## Rule: export-zod-type

Ensures that when you export a Zod schema as a `const`, you also export the corresponding TypeScript type using `z.infer`.

### ❌ Incorrect

```ts
export const Schema = z.object({});
```

### ✅ Correct

```ts
export const Schema = z.object({});
export type Schema = z.infer<typeof Schema>;
```

The rule respects your semicolon style and supports multiple schemas per file.
