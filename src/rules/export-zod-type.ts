import { AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(() => '');

/**
 * Find pattern like `z.object({}).partial().partial()...`
 */
const isZodSchema = (expression: TSESTree.Expression): boolean => {
  if (expression.type === AST_NODE_TYPES.CallExpression) {
    const callee = expression.callee;
    // Check the outer `z.object({}).partial()`
    if (callee.type === AST_NODE_TYPES.MemberExpression) {
      if (callee.object.type === AST_NODE_TYPES.Identifier && callee.object.name === 'z') {
        return true;
      }

      // Try the inner maybe `z.object({})`
      return isZodSchema(callee.object);
    }
  }
  return false;
};

const exportZodType = createRule({
  name: 'export-zod-type',
  meta: {
    docs: {
      description:
        'If `export const Schema = ...` is used, there should be `export type Schema = z.infer<typeof Schema>`',
    },
    messages: {
      'export-zod-type':
        'If `export const Schema = ...` is used, there should be `export type Schema = z.infer<typeof Schema>`',
    },
    type: 'suggestion',
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      Program(programNode) {
        const zodSchemas: { name: string; node: TSESTree.Node }[] = [];
        const expotedTypes = new Set<string>();

        for (const statement of programNode.body) {
          if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && statement.declaration) {
            if (statement.declaration.type === AST_NODE_TYPES.VariableDeclaration) {
              const variableDeclaration = statement.declaration;

              for (const zodSchemaNode of variableDeclaration.declarations.filter(
                (declaration) =>
                  declaration.id.type === AST_NODE_TYPES.Identifier &&
                  declaration.init &&
                  isZodSchema(declaration.init),
              )) {
                zodSchemas.push({
                  name: (zodSchemaNode.id as TSESTree.Identifier).name,
                  node: zodSchemaNode,
                });
              }
            }

            if (statement.declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
              expotedTypes.add((statement.declaration.id as TSESTree.Identifier).name);
            }
          }
        }

        for (const { name, node } of zodSchemas) {
          if (!expotedTypes.has(name)) {
            context.report({
              node,
              messageId: 'export-zod-type',
              fix(fixer) {
                const lastToken = sourceCode.getTokenAfter(node);
                const hasSemicolon =
                  lastToken &&
                  lastToken.type === AST_TOKEN_TYPES.Punctuator &&
                  lastToken.value === ';';
                const target = hasSemicolon ? lastToken : node;

                return fixer.insertTextAfter(
                  target,
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
