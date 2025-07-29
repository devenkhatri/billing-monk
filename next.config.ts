import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude docs folder from Next.js build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore docs folder during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
    }
    
    // Ignore docs folder
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/docs/**', '**/node_modules/**']
    };
    
    return config;
  },
  
  // Experimental features
  experimental: {
    // Enable if needed
  }
};

export default nextConfig;
