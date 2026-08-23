export default {
  locales: ["en"],
  output: "messages/$LOCALE.json",
  input: ["src/**/*.{js,jsx,ts,tsx}"],
  keySeparator: false,
  namespaceSeparator: false,
  defaultValue: (lng, ns, key) => key,
  lexers: {
    ts: ["JsxLexer"],
    tsx: ["JsxLexer"],
    js: ["JsxLexer"],
    jsx: ["JsxLexer"],
  },
};
