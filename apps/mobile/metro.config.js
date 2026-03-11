const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force React and related packages to resolve from mobile's node_modules
// Prevents "Invalid hook call" errors in monorepos
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_target, name) => {
      if (name === "react" || name === "react-native" || name === "react-dom") {
        return path.join(mobileNodeModules, String(name));
      }
      const mobileModule = path.join(mobileNodeModules, String(name));
      const rootModule = path.join(monorepoRoot, "node_modules", String(name));
      try {
        require.resolve(mobileModule);
        return mobileModule;
      } catch {
        return rootModule;
      }
    },
  },
);

// 4. Apply Uniwind — must wrap all other config modifications
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
