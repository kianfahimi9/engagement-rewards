// Inline withWhopAppConfig to avoid module resolution issues
function withWhopAppConfig(nextConfig, whopAppOptions = {}) {
  return async function applyWhopAppConfig(phase, defaults) {
    const resolvedConfig = typeof nextConfig === "function" ? await nextConfig(phase, defaults) : nextConfig;
    resolvedConfig.experimental ??= {};
    resolvedConfig.experimental.serverActions ??= {};
    resolvedConfig.experimental.serverActions.allowedOrigins ??= [];
    resolvedConfig.experimental.serverActions.allowedOrigins.push(`${whopAppOptions.domainId ?? "*"}.apps.whop.com`);
    resolvedConfig.experimental.optimizePackageImports ??= [];
    resolvedConfig.experimental.optimizePackageImports.push("frosted-ui");
    return resolvedConfig;
  };
}

const nextConfig = {
  // TypeScript configuration - ignore build errors (we use JavaScript)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Server external packages (Next.js 15+)
  serverExternalPackages: ['mongodb'],
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
};

module.exports = withWhopAppConfig(nextConfig);
