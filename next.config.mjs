/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "orgbling.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "jyoywekxcuyjfynobkpv.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;