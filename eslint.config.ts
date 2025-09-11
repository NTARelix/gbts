import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist'] },
    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },
    },
    eslint.configs.recommended,
    stylistic.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        rules: {
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            '@stylistic/indent': ['warn', 4],
            '@stylistic/jsx-indent-props': ['warn', 4],
            '@stylistic/max-statements-per-line': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/restrict-template-expressions': 'off',
            'no-self-assign': 'off',
            'no-unused-vars': 'off',
        },
    },
    {
        files: ['*.ts', '*.tsx'],
        ignores: ['*.test.ts'],
        languageOptions: {
            globals: { ...globals.browser },
        },
    },
    {
        files: ['*.test.ts'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
)
