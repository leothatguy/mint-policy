'use client';

import { WalletConnect } from './components/WalletConnect';
import { MintAlways } from './components/MintAlways';
import { MintOnetime } from './components/MintOnetime';
import { MintFenix } from './components/MintFenix';
import { ConfigHelper } from './components/ConfigHelper';
import { Coins, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
	return (
		<div className="min-h-screen bg-black text-ivory">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
				<header className="mb-8 sm:mb-12 text-center border-b border-gold pb-6 sm:pb-8 animate-fade-in">
					<div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
						<Coins className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gold" strokeWidth={1.5} />
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gold">Cardano Minting Policy</h1>
					</div>
					<p className="text-ivory/80 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
						Mint and manage your tokens: "always", "onetime", and "fenix"
					</p>
				</header>

				<main className="max-w-7xl mx-auto">
					<section className="mb-8 sm:mb-12 animate-fade-in">
						<WalletConnect />
					</section>

					<section className="mb-8 sm:mb-12 animate-fade-in">
						<ConfigHelper />
					</section>

					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
						<MintAlways />
						<MintOnetime />
						<MintFenix />
					</div>

					<section className="mt-8 sm:mt-12 p-4 sm:p-6 border border-gold/30 rounded-lg bg-black hover:border-gold transition-colors animate-fade-in">
						<div className="flex items-center gap-3 mb-4 sm:mb-6">
							<Info className="w-6 h-6 text-gold" strokeWidth={1.5} />
							<h2 className="text-xl sm:text-2xl font-bold text-gold">Token Rules</h2>
						</div>
						<div className="space-y-4">
							<div className="p-4 sm:p-5 border-l-4 border-gold bg-black/50 hover:bg-black/70 transition-colors rounded-r">
								<h3 className="text-base sm:text-lg font-semibold text-gold mb-2 flex items-center gap-2">
									"always" Token
								</h3>
								<p className="text-xs sm:text-sm text-ivory/80 leading-relaxed">
									Can be minted by anyone at any time. No restrictions apply.
								</p>
							</div>

							<div className="p-4 sm:p-5 border-l-4 border-gold bg-black/50 hover:bg-black/70 transition-colors rounded-r">
								<h3 className="text-base sm:text-lg font-semibold text-gold mb-2 flex items-center gap-2">
									"onetime" Token
								</h3>
								<p className="text-xs sm:text-sm text-ivory/80 leading-relaxed">
									Can only be minted by the project owner, and only once forever. Requires owner signature and
									consumption of a specific UTXO.
								</p>
							</div>

							<div className="p-4 sm:p-5 border-l-4 border-gold bg-black/50 hover:bg-black/70 transition-colors rounded-r">
								<h3 className="text-base sm:text-lg font-semibold text-gold mb-2 flex items-center gap-2">
									"fenix" Token
								</h3>
								<p className="text-xs sm:text-sm text-ivory/80 leading-relaxed">
									Can only be minted by burning both "always" and "onetime" tokens in the same transaction. This creates
									a phoenix-like rebirth from the ashes.
								</p>
							</div>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}
