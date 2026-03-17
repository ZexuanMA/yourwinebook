import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  generateBuildId: async () => `deploy-${Date.now().toString(36)}`,
};

export default withNextIntl(nextConfig);
