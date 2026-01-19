'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMintingPolicy } from '../hooks/useMintingPolicy';
import { Transaction } from '@meshsdk/core';
import { MINTING_CONFIG, ASSET_NAMES } from '../config';
import { Infinity, Loader2 } from 'lucide-react';

export function MintAlways() {
	const { wallet, connected } = useWallet();
	const { parameterizeScript, policyId, isConfigComplete, error: policyError } = useMintingPolicy();
	const [amount, setAmount] = useState<string>('1');
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<string>('');

	const handleMint = async () => {
		if (!connected || !wallet) {
			setStatus('Please connect your wallet first');
			return;
		}

		if (!isConfigComplete) {
			setStatus(
				'Error: Configuration incomplete. Please set owner VKH and UTXO reference in config.ts or environment variables.',
			);
			return;
		}

		setLoading(true);
		setStatus('Parameterizing script...');

		try {
			const result = await parameterizeScript();
			if (!result) {
				setStatus('Error: Failed to parameterize script');
				setLoading(false);
				return;
			}
			const { script: policyScript, policyId: calculatedPolicyId } = result;
			const finalPolicyId = calculatedPolicyId || policyId;

			if (!finalPolicyId) {
				setStatus('Error: Could not calculate policy ID');
				setLoading(false);
				return;
			}

			setStatus('Selecting collateral...');

			const utxos = await wallet.getUtxos();
			// Collateral MUST be pure ADA only (Cardano blockchain rule)
			const collateralUtxo = utxos.find((utxo: any) => {
				const adaAmount = utxo.output?.amount?.find((a: any) => a.unit === 'lovelace')?.quantity || '0';
				const adaValue = parseInt(adaAmount);
				const hasOnlyAda =
					!utxo.output?.amount ||
					utxo.output.amount.length === 1 ||
					utxo.output.amount.every((a: any) => a.unit === 'lovelace');
				return hasOnlyAda && adaValue >= 2000000;
			});

			if (!collateralUtxo) {
				setStatus(
					'Error: No pure ADA UTXO found for collateral. Send 5 ADA to yourself to create a UTXO with no tokens, then try again.',
				);
				setLoading(false);
				return;
			}

			setStatus('Building transaction...');

			const assetName = ASSET_NAMES.ALWAYS;
			const tx = new Transaction({ initiator: wallet });

			tx.setCollateral([collateralUtxo]);

			tx.mintAsset(
				policyScript,
				{
					assetName: assetName,
					assetQuantity: amount,
				},
				{
					data: 'd87980',
				},
			);

			setStatus('Signing transaction...');
			const unsignedTx = await tx.build();

			const signedTx = await wallet.signTx(unsignedTx);
			const txHash = await wallet.submitTx(signedTx);

			setStatus(`Success! Transaction hash: ${txHash}`);
		} catch (error: any) {
			setStatus(`Error: ${error.message}`);
			console.error('Minting error:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 sm:p-6 border border-gold/30 rounded-lg bg-black hover:border-gold transition-colors card-hover animate-fade-in">
			<div className="flex items-center gap-3 mb-4">
				<Infinity className="w-6 h-6 text-gold" strokeWidth={1.5} />
				<h3 className="text-lg sm:text-xl font-bold text-gold">"always" Token</h3>
			</div>
			<p className="text-ivory/70 mb-4 text-xs sm:text-sm">Can be minted by anyone at any time.</p>

			<div className="flex flex-col gap-4">
				<div>
					<label className="block text-ivory text-sm font-medium mb-2">Amount</label>
					<input
						type="number"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						min="1"
						className="w-full px-4 py-2 sm:py-3 bg-black border border-gold/30 rounded text-ivory focus:outline-none focus:border-gold transition-colors"
						disabled={loading || !connected}
					/>
				</div>

				<button
					onClick={handleMint}
					disabled={loading || !connected}
					className="w-full px-6 py-2 sm:py-3 bg-gold text-black font-semibold rounded hover:bg-[#c4a33a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
					{loading ? (
						<>
							<Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
							<span>Processing...</span>
						</>
					) : (
						<span>Mint "always" Token</span>
					)}
				</button>

				{status && (
					<div
						className={`p-3 rounded text-xs sm:text-sm break-words overflow-hidden font-mono ${
							status.includes('Error')
								? 'bg-red-900/20 border border-red-500/30 text-red-200'
								: status.includes('Success')
									? 'bg-green-900/20 border border-green-500/30 text-green-200'
									: 'bg-black/50 border border-gold/20 text-ivory/80'
						}`}>
						{status}
					</div>
				)}
			</div>
		</div>
	);
}
