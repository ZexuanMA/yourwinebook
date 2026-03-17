const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

// Monorepo workspace root
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// 1. Watch the entire monorepo so Metro picks up changes in packages/*
config.watchFolders = [workspaceRoot];

// 2. Tell Metro where to find node_modules:
//    - mobile's own node_modules (direct deps)
//    - workspace root node_modules (hoisted deps via pnpm)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Ensure single copies of React and React Native across the monorepo
//    to prevent "multiple React instances" errors when packages/* are added
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
  "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
};

module.exports = config;
