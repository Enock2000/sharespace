/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['images.unsplash.com'],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '500mb',
        },
    },
}

module.exports = nextConfig
