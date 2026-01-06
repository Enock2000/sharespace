/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: [],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '500mb',
        },
    },
}

module.exports = nextConfig
