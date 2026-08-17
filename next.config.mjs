/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'pino'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
