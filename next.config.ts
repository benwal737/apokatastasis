/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config: any) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Upgrade",
            value: "websocket",
          },
          {
            key: "Connection",
            value: "Upgrade",
          },
        ],
      },
    ];
  },
  // Add this if you're using static exports
  output: "standalone",
  // Add this if you're using server components with WebSocket
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
