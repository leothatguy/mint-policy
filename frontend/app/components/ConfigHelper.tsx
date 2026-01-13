'use client';

import { useWallet } from '../hooks/useWallet';
import { resolvePaymentKeyHash } from '@meshsdk/core';
import { useState } from 'react';
import { Settings, Copy, CheckCheck, Loader2 } from 'lucide-react';

export function ConfigHelper() {
	const { address, connected, wallet } = useWallet();
	const [ownerVkh, setOwnerVkh] = useState<string>('');
	const [copied, setCopied] = useState(false);
	const [utxos, setUtxos] = useState<any[]>([]);
	const [loadingUtxos, setLoadingUtxos] = useState(false);
	const [copiedUtxo, setCopiedUtxo] = useState<string | null>(null);

	const extractOwnerVkh = () => {
		if (!address) {
			alert('Please connect your wallet first');
			return;
		}

		try {
			const vkh = resolvePaymentKeyHash(address);
			setOwnerVkh(vkh);
		} catch (error: any) {
			alert(`Error extracting owner VKH: ${error.message}`);
		}
	};

	const fetchUtxos = async () => {
		if (!wallet) {
			alert('Please connect your wallet first');
			return;
		}

		setLoadingUtxos(true);
		try {
			const walletUtxos = await wallet.getUtxos();
			setUtxos(walletUtxos);
		} catch (error: any) {
			alert(`Error fetching UTXOs: ${error.message}`);
		} finally {
			setLoadingUtxos(false);
		}
	};

	const copyToClipboard = () => {
		if (ownerVkh) {
			navigator.clipboard.writeText(ownerVkh);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const copyUtxoInfo = (txId: string, outputIndex: number) => {
		const envVars = `NEXT_PUBLIC_UTXO_TX_ID=${txId}\nNEXT_PUBLIC_UTXO_INDEX=${outputIndex}`;
		navigator.clipboard.writeText(envVars);
		setCopiedUtxo(`${txId}-${outputIndex}`);
		setTimeout(() => setCopiedUtxo(null), 2000);
	};

	if (!connected) {
		return null;
	}

	return (
		<div className="p-4 sm:p-6 border border-gold/30 rounded-lg bg-black hover:border-gold transition-colors card-hover">
			<div className="flex items-center gap-3 mb-4">
				<Settings className="w-6 h-6 text-gold" strokeWidth={1.5} />
				<h4 className="text-lg sm:text-xl font-bold text-gold">Configuration Helper</h4>
			</div>

			<div className="space-y-4">
				<div>
					<p className="text-ivory/80 text-xs sm:text-sm mb-2">Extract Owner VKH from your wallet:</p>
					<button
						onClick={extractOwnerVkh}
						className="px-4 py-2 bg-gold text-black rounded hover:bg-[#c4a33a] transition-colors text-sm font-medium">
						Extract Owner VKH
					</button>
				</div>

				{ownerVkh && (
					<div className="p-3 bg-black/50 border border-gold/20 rounded">
						<p className="text-ivory/80 text-xs sm:text-sm mb-2">Owner VKH:</p>
						<div className="flex gap-2">
							<code className="flex-1 p-2 bg-black border border-gold/30 rounded text-gold text-xs break-all font-mono">
								{ownerVkh}
							</code>
							<button
								onClick={copyToClipboard}
								className="px-3 py-2 bg-gold/10 border border-gold/30 text-gold rounded hover:bg-gold hover:text-black transition-colors text-sm flex items-center gap-1 shrink-0">
								{copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
								<span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
							</button>
						</div>
						<p className="text-ivory/60 text-xs mt-2">
							Add to <code className="text-gold">`.env`</code> as{' '}
							<code className="text-gold">NEXT_PUBLIC_OWNER_VKH</code>
						</p>
					</div>
				)}

				<div className="pt-3 border-t border-gold/20">
					<p className="text-ivory/80 text-xs sm:text-sm mb-2">Get UTXO Reference for "onetime" token:</p>
					<button
						onClick={fetchUtxos}
						disabled={loadingUtxos}
						className="px-4 py-2 bg-gold text-black rounded hover:bg-[#c4a33a] transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2">
						{loadingUtxos && <Loader2 className="w-4 h-4 animate-spin" />}
						{loadingUtxos ? 'Loading...' : 'Show My UTXOs'}
					</button>

					{utxos.length > 0 && (
						<div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
							<p className="text-ivory/60 text-xs">
								Click "Copy" on any UTXO to copy env variables. Choose one for the onetime mint:
							</p>
							{utxos.map((utxo: any, index: number) => {
								const txHash = utxo.input?.txHash || utxo.txHash;
								const outputIndex = utxo.input?.outputIndex ?? utxo.outputIndex;
								const amounts = utxo.output?.amount || [];
								const adaAmount = amounts.find((a: any) => a.unit === 'lovelace')?.quantity || '0';
								const adaValue = parseInt(adaAmount) / 1000000;
								const otherTokens = amounts.filter((a: any) => a.unit !== 'lovelace').length;
								const uniqueKey = `${txHash}-${outputIndex}`;

								return (
									<div
										key={uniqueKey}
										className="p-3 bg-black/50 border border-gold/20 rounded text-xs hover:border-gold/40 transition-colors">
										<div className="flex justify-between items-start gap-2 mb-2">
											<div className="flex-1 min-w-0">
												<p className="text-gold font-semibold mb-1">UTXO #{index}</p>
												<p className="text-ivory/80 font-mono text-xs break-all">
													<span className="text-gold/60">TX:</span> {txHash?.substring(0, 16)}...
													{txHash?.substring(txHash.length - 8)}
												</p>
												<p className="text-ivory/80 mt-1">
													<span className="text-gold/60">Index:</span> {outputIndex}
												</p>
												<p className="text-ivory/80">
													<span className="text-gold/60">ADA:</span> {adaValue.toFixed(2)} ADA
													{otherTokens > 0 && <span className="text-yellow-400 ml-1">(+ {otherTokens} token(s))</span>}
												</p>
											</div>
											<button
												onClick={() => copyUtxoInfo(txHash, outputIndex)}
												className="px-2 py-1 bg-gold/10 border border-gold/30 text-gold rounded hover:bg-gold hover:text-black transition-colors text-xs shrink-0 flex items-center gap-1">
												{copiedUtxo === uniqueKey ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
												<span className="hidden sm:inline">{copiedUtxo === uniqueKey ? 'Copied' : 'Copy'}</span>
											</button>
										</div>
										{copiedUtxo === uniqueKey && (
											<p className="text-green-400 text-xs mt-1 flex items-center gap-1">
												<CheckCheck className="w-3 h-3" />
												Copied to clipboard! Paste into your .env file
											</p>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
