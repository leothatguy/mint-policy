'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { BrowserWallet } from '@meshsdk/core';
import { Wallet, CheckCircle, X } from 'lucide-react';

export function WalletConnect() {
	const { connected, address, loading, connectWallet, disconnect } = useWallet();
	const [showWallets, setShowWallets] = useState(false);
	const [availableWallets, setAvailableWallets] = useState<string[]>([]);

	const handleShowWallets = async () => {
		const wallets = BrowserWallet.getInstalledWallets();
		setAvailableWallets(wallets.map((w) => w.name));
		setShowWallets(true);
	};

	const handleConnect = async (walletName: string) => {
		await connectWallet(walletName);
		setShowWallets(false);
	};

	const formatAddress = (addr: string) => {
		if (!addr) return '';
		return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
	};

	if (connected && address) {
		return (
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 border border-gold/30 rounded-lg bg-black hover:border-gold transition-colors card-hover">
				<div className="flex items-center gap-3">
					<CheckCircle className="w-6 h-6 text-gold" strokeWidth={1.5} />
					<div>
						<h2 className="text-lg sm:text-xl font-bold text-gold">Wallet Connected</h2>
						<p className="text-xs sm:text-sm text-ivory/60 mt-1 font-mono">{formatAddress(address)}</p>
					</div>
				</div>
				<button
					onClick={disconnect}
					className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-black border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors">
					<X className="w-4 h-4" strokeWidth={2} />
					<span>Disconnect</span>
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-4 p-4 sm:p-6 border border-gold/30 rounded-lg bg-black hover:border-gold transition-colors card-hover">
			<div className="flex items-center gap-3">
				<Wallet className="w-6 h-6 text-gold" strokeWidth={1.5} />
				<h2 className="text-lg sm:text-xl font-bold text-gold">Connect Wallet</h2>
			</div>
			{!showWallets ? (
				<button
					onClick={handleShowWallets}
					disabled={loading}
					className="w-full sm:w-auto px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-[#c4a33a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
					<Wallet className="w-5 h-5" strokeWidth={2} />
					<span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
				</button>
			) : (
				<div className="w-full flex flex-col gap-4">
					<p className="text-ivory/80 text-center text-sm">Choose a wallet:</p>
					{availableWallets.length === 0 ? (
						<p className="text-ivory/60 text-center text-xs sm:text-sm p-4 bg-black/50 border border-gold/20 rounded">
							No Cardano wallets found. Please install a wallet extension like Nami, Eternl, or Lace.
						</p>
					) : (
						<div className="flex flex-col gap-2">
							{availableWallets.map((walletName) => (
								<button
									key={walletName}
									onClick={() => handleConnect(walletName)}
									className="px-4 py-3 bg-black border border-gold/30 rounded text-ivory hover:bg-gold hover:text-black hover:border-gold transition-colors font-medium">
									{walletName}
								</button>
							))}
						</div>
					)}
					<button
						onClick={() => setShowWallets(false)}
						className="px-4 py-2 bg-black border border-gold/30 text-ivory rounded hover:bg-gold/10 hover:border-gold transition-colors">
						Cancel
					</button>
				</div>
			)}
		</div>
	);
}
