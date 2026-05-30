/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true }, // external hotlinked portraits; keeps it static-first + free
};
export default nextConfig;
