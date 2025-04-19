import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(() => '');

/**
 * Find pattern like `z.object({}).partial().partial()...`
 */
const isZodSchema = (
  expression: TSESTree.Expression,
  customZodSchemaBuilders: string[],
): boolean => {
  if (expression.type === AST_NODE_TYPES.CallExpression) {
    const callee = expression.callee;
    // Check the outer `z.object({}).partial()`
    if (
      callee.type === AST_NODE_TYPES.Identifier &&
      customZodSchemaBuilders.includes(callee.name)
    ) {
      return true;
    }

    if (callee.type === AST_NODE_TYPES.MemberExpression) {
      if (callee.object.type === AST_NODE_TYPES.Identifier && callee.object.name === 'z') {
        return true;
      }

      // Try the inner maybe `z.object({})`
      return isZodSchema(callee.object, customZodSchemaBuilders);
    }
  }
  return false;
};

type Options = [
  {
    excludeNameRegex?: string;
    customZodSchemaBuilders?: string[];
  },
];

const exportZodType = createRule({
  name: 'export-zod-type',
  meta: {
    docs: {
      description:
        'If `export const Schema = ...` is used, there should be `export type Schema = z.infer<typeof Schema>`',
    },
    messages: {
      'export-zod-type': 'Missing `export type Schema = z.infer<typeof Schema>`',
    },
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        properties: {
          excludeNameRegex: { type: 'string' },
          customZodSchemaBuilders: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    fixable: 'code',
  },
  defaultOptions: [
    {
      excludeNameRegex: '',
      customZodSchemaBuilders: [],
    } as Options[0],
  ],
  create(context, options) {
    const { sourceCode } = context;
    const { excludeNameRegex, customZodSchemaBuilders = [] } = options[0];
    return {
      Program(programNode) {
        const zodSchemas: {
          name: string;
          node: TSESTree.Node;
          hasSemicolon: boolean;
          fixAfter: TSESTree.Node | TSESTree.Token;
        }[] = [];
        const expotedTypes = new Set<string>();

        for (const statement of programNode.body) {
          if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && statement.declaration) {
            if (statement.declaration.type === AST_NODE_TYPES.VariableDeclaration) {
              const variableDeclaration = statement.declaration;

              for (const zodSchemaNode of variableDeclaration.declarations.filter(
                (declaration) =>
                  declaration.id.type === AST_NODE_TYPES.Identifier &&
                  declaration.init &&
                  isZodSchema(declaration.init, customZodSchemaBuilders),
              )) {
                const name = (zodSchemaNode.id as TSESTree.Identifier).name;
                if (excludeNameRegex && new RegExp(excludeNameRegex).test(name)) {
                  continue;
                }

                const lastToken = sourceCode.getTokenAfter(zodSchemaNode);
                const hasSemicolon =
                  lastToken !== null &&
                  lastToken.type === AST_TOKEN_TYPES.Punctuator &&
                  lastToken.value === ';';
                const fixAfter = hasSemicolon ? lastToken : zodSchemaNode;

                zodSchemas.push({
                  name: (zodSchemaNode.id as TSESTree.Identifier).name,
                  node: zodSchemaNode.id,
                  hasSemicolon,
                  fixAfter,
                });
              }
            }

            if (statement.declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
              expotedTypes.add((statement.declaration.id as TSESTree.Identifier).name);
            }
          }
        }

        for (const { name, node, hasSemicolon, fixAfter } of zodSchemas) {
          if (!expotedTypes.has(name)) {
            context.report({
              node,
              messageId: 'export-zod-type',
              fix(fixer) {
                return fixer.insertTextAfter(
                  fixAfter,
                  `\nexport type ${name} = z.infer<typeof ${name}>${hasSemicolon ? ';' : ''}`,
                );
              },
            });
          }
        }
      },
    };
  },
});

export default exportZodType;
