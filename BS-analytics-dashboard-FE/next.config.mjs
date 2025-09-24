/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Environment variables that should be available in the browser
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
  },
  
  // API routes configuration - proxy to Flask backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ]
  },
  
  // CORS configuration for API calls
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ]
  },
  
  // Image domains for optimized loading
  images: {
    // Keep your existing unoptimized setting for development
    unoptimized: true,
    domains: [
      'localhost',
      // Add your production domains here when ready
    ],
  },
  
  // TypeScript configuration - preserve your existing settings
  typescript: {
    // Keep build errors ignored as per your current setup
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration - preserve your existing settings
  eslint: {
    // Keep ESLint ignored during builds as per your current setup
    ignoreDuringBuilds: true,
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
}

export default nextConfig