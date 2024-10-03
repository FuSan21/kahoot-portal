import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/host/dashboard",
        permanent: true,
      },
      {
        source: "/host",
        destination: "/host/dashboard",
        permanent: true,
      },
    ];
  },
  images: {
    domains: [process.env.SUPABASE_DOMAIN],
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);
