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


### Option: excludeNameRegex

Suppose you want to exclude all schema names that start with an underscore from requiring a type export. You can use the `excludeNameRegex` option:

```json
{
  "rules": {
    "zod2/export-zod-type": ["error", {
      "excludeNameRegex": "^_"
    }]
  }
}
```

Now, the following is allowed:

```ts
export const _Internal = z.object({});
// No type export required for _Internal
```

### Option: customZodSchemaBuilders

Suppose you have a custom function `myZodSchema` that returns a Zod schema:

```ts
export const MySchema = myZodSchema({});
```

By default, the rule does not recognize `myZodSchema` as a Zod schema builder. To enforce type export for this, add it to `customZodSchemaBuilders`:

```json
{
  "rules": {
    "zod2/export-zod-type": ["error", {
      "customZodSchemaBuilders": ["myZodSchema"]
    }]
  }
}
```

Now, the following will be required:

```ts
export const MySchema = myZodSchema({});
export type MySchema = z.infer<typeof MySchema>;
```
