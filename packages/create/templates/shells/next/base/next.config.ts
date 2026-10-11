import type { NextConfig } from 'next';

// `next dev` otherwise rewrites the CLAUDE.md and AGENTS.md this project owns.
const nextConfig: NextConfig = { agentRules: false };

export default nextConfig;
