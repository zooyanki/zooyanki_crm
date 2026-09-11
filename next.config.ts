import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Не перезаписывать AGENTS.md — там правила проекта, не Next.js.
  agentRules: false,
};

export default nextConfig;
