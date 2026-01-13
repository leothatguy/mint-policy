import { useState, useEffect } from 'react';
import { BrowserWallet } from '@meshsdk/core';

export function useWallet() {
	const [wallet, setWallet] = useState<BrowserWallet | null>(null);
	const [connected, setConnected] = useState(false);
	const [address, setAddress] = useState<string>('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const savedWalletName = localStorage.getItem('connectedWallet');
		if (savedWalletName) {
			connectWallet(savedWalletName).catch((error) => {
				console.error('Auto-reconnect failed:', error);
			});
		}
	}, []);

	const connectWallet = async (walletName: string) => {
		try {
			setLoading(true);
			const browserWallet = await BrowserWallet.enable(walletName);
			const walletAddress = await browserWallet.getChangeAddress();

			setWallet(browserWallet);
			setAddress(walletAddress);
			setConnected(true);
			localStorage.setItem('connectedWallet', walletName);
		} catch (error) {
			console.error('Failed to connect wallet:', error);
			setConnected(false);
		} finally {
			setLoading(false);
		}
	};

	const disconnect = () => {
		setWallet(null);
		setAddress('');
		setConnected(false);
		localStorage.removeItem('connectedWallet');
	};

	return {
		wallet,
		connected,
		address,
		loading,
		connectWallet,
		disconnect,
	};
}
