import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	// Add empty turbopack config to silence warning
	// We use webpack for WASM support
	turbopack: {},
	webpack: (config) => {
		// Handle WASM files for @meshsdk/core-csl
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};

		// Fix for WASM files in node_modules
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
		};

		return config;
	},
};

export default nextConfig;
