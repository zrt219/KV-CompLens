import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "complete-sources.js",
      "fix-*.js",
      "remove-tutorial.js"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
