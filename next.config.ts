import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Call without arguments for Next.js 16 Turbopack auto-discovery
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactCompiler: true,
  compiler: { styledComponents: true },
};

export default withNextIntl(nextConfig);
