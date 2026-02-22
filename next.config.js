/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    // Enforce strict React mode for better hydration error detection
    reactStrictMode: true,
    // Compress static assets with gzip
    compress: true,
    // Remove X-Powered-By header (security + minor payload win)
    poweredByHeader: false,
    images: {
        // Serve modern image formats where supported
        formats: ['image/avif', 'image/webp'],
    },
}

module.exports = nextConfig
