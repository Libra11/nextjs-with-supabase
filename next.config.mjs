/*
 * @Author: Libra
 * @Date: 2025-03-10 11:35:56
 * @LastEditTime: 2025-10-29 14:21:13
 * @LastEditors: Libra
 * @Description:
 */
// next.config.mjs
const nextConfig = {
  output: "standalone",
  reactCompiler: true,
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      }
    );

    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  },
  images: {
    unoptimized: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.penlibra.xin",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
