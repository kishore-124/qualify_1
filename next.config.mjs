/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle (.next/standalone) used by the Docker image
  output: 'standalone',
  // Prisma's Rust-free client loads its query compiler (.wasm) at runtime — make sure it's copied
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/runtime/*.wasm*'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
