import tsParser from "@typescript-eslint/parser"
export default [
    {
        ignores: [
            ".nyc_output",
            ".temp",
            "coverage",
            "**/node_modules",
            "test/fixtures",
            "test/temp",
            "index.d.ts",
            "index.js",
        ],
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            globals: {
                process: "readonly",
                require: "readonly",
            },
        },
    }
]
