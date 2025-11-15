/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    unoptimized: true, // PDF生成時の画像処理用
  },
}

module.exports = nextConfig

