/** @type {import('next').NextConfig} */
const nextConfig = {
    // Pass to FastAPI locally, otherwise Vercel routes natively
    rewrites: async () => {
        return [
            {
                source: '/api/:path*',
                destination:
                    process.env.NODE_ENV === 'development'
                        ? 'http://127.0.0.1:5328/api/:path*'
                        : '/api/',
            },
        ]
    },
};

export default nextConfig;
