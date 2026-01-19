'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMintingPolicy } from '../hooks/useMintingPolicy';
import { Transaction } from '@meshsdk/core';
import { MINTING_CONFIG, ASSET_NAMES } from '../config';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

export function MintOnetime() {
	const { wallet, connected } = useWallet();
	const { parameterizeScript, policyId, isConfigComplete, error: policyError } = useMintingPolicy();
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

			const utxoRef = MINTING_CONFIG.onetimeUtxoRef;
			setStatus('Checking for required UTXO...');
			const utxos = await wallet.getUtxos();

			const normalizedTxId = utxoRef.transactionId.startsWith('0x')
				? utxoRef.transactionId.slice(2)
				: utxoRef.transactionId;

			const targetUtxo = utxos.find((utxo: any) => {
				const txHash = utxo.input?.txHash || utxo.txHash;
				const outputIndex = utxo.input?.outputIndex ?? utxo.outputIndex;
				const normalizedUtxoTxHash = txHash?.startsWith('0x') ? txHash.slice(2) : txHash;

				return (
					normalizedUtxoTxHash?.toLowerCase() === normalizedTxId.toLowerCase() && outputIndex === utxoRef.outputIndex
				);
			});

			if (!targetUtxo) {
				setStatus(
					`Error: Could not find the required UTXO. Looking for: ${normalizedTxId.substring(0, 16)}... (index ${
						utxoRef.outputIndex
					}). Make sure you have this UTXO in your wallet and that the transaction ID and output index are correct in your config.`,
				);
				setLoading(false);
				return;
			}

			setStatus('Selecting collateral...');

			const allUtxos = await wallet.getUtxos();
			const collateralUtxo = allUtxos.find((utxo: any) => {
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
					'Error: No suitable UTXO found for collateral. You need at least 2 ADA in a UTXO with no other tokens.',
				);
				setLoading(false);
				return;
			}

			setStatus('Building transaction...');

			const assetName = ASSET_NAMES.ONETIME;
			const tx = new Transaction({ initiator: wallet });

			tx.setCollateral([collateralUtxo]);

			const walletAddress = await wallet.getChangeAddress();
			tx.setRequiredSigners([walletAddress]);

			// Consume the required UTXO as an input (required by the Plutus validator)
			tx.setTxInputs([targetUtxo]);

			tx.mintAsset(
				policyScript,
				{
					assetName: assetName,
					assetQuantity: '1',
				},
				{
					data: 'd87980',
				},
			);

			// Send the minted token to the wallet (so it shows up in your wallet!)
			const finalPolicyIdForAsset = calculatedPolicyId || policyId;
			tx.sendAssets(walletAddress, [
				{
					unit: finalPolicyIdForAsset + assetName,
					quantity: '1',
				},
			]);

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
				<Lock className="w-6 h-6 text-gold" strokeWidth={1.5} />
				<h3 className="text-lg sm:text-xl font-bold text-gold">"onetime" Token</h3>
			</div>
			<p className="text-ivory/70 mb-4 text-xs sm:text-sm">Can only be minted by the owner, once forever.</p>

			<div className="flex flex-col gap-4">
				<div className="p-3 border border-gold/20 rounded bg-black/50 text-ivory/80 text-xs flex items-start gap-2">
					<AlertCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" strokeWidth={1.5} />
					<div>
						<p className="text-gold font-semibold mb-1">Owner Only</p>
						<p>Make sure you're using the owner wallet.</p>
					</div>
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
						<span>Mint "onetime" Token</span>
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
