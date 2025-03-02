import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["build/*", "eslint.config.mjs"],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.jest,
        },

        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: "module",
    },

    rules: {
        "brace-style": ["error", "1tbs", {
            allowSingleLine: true,
        }],

        camelcase: ["warn"],
        "comma-dangle": ["warn", "always-multiline"],
        curly: ["warn", "all"],
        "default-case": ["error"],

        eqeqeq: ["error", "always", {
            null: "always",
        }],

        indent: ["warn", 4, {
            SwitchCase: 1,
            ArrayExpression: "first",
            ImportDeclaration: "first",
            ObjectExpression: "first",
        }],

        "linebreak-style": ["error", "unix"],
        "no-trailing-spaces": ["warn"],

        "no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],

        "no-useless-escape": ["off"],
        quotes: ["error", "single"],
        semi: ["error", "always"],
        "semi-style": ["warn", "last"],

        "sort-imports": ["warn", {
            ignoreCase: true,
            memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
            allowSeparatedGroups: true,
        }],

        "sort-vars": ["warn"],
        "@typescript-eslint/explicit-function-return-type": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],
    },
}, {
    files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.tsx"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "error",
    },
}];