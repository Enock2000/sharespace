/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: [],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
}

module.exports = nextConfig
