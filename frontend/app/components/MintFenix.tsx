'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMintingPolicy } from '../hooks/useMintingPolicy';
import { Transaction } from '@meshsdk/core';
import { MINTING_CONFIG, ASSET_NAMES } from '../config';
import { Flame, Loader2, AlertTriangle } from 'lucide-react';

export function MintFenix() {
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

			setStatus('Checking for required tokens...');

			const assets = await wallet.getAssets();

			const alwaysHex = Buffer.from(ASSET_NAMES.ALWAYS, 'utf8').toString('hex');
			const onetimeHex = Buffer.from(ASSET_NAMES.ONETIME, 'utf8').toString('hex');

			const alwaysAsset = assets.find((asset: any) => asset.unit.endsWith(alwaysHex));
			const onetimeAsset = assets.find((asset: any) => asset.unit.endsWith(onetimeHex));

			if (!alwaysAsset || !onetimeAsset) {
				const missingTokens = [];
				if (!alwaysAsset) missingTokens.push('"always"');
				if (!onetimeAsset) missingTokens.push('"onetime"');
				setStatus(
					`Error: Missing required tokens: ${missingTokens.join(' and ')}. You need both tokens in your wallet.`,
				);
				setLoading(false);
				return;
			}

			if (parseInt(alwaysAsset.quantity) < 1 || parseInt(onetimeAsset.quantity) < 1) {
				setStatus('Error: You must have at least 1 "always" and 1 "onetime" token to mint "fenix".');
				setLoading(false);
				return;
			}

			const alwaysPolicyId = alwaysAsset.unit.slice(0, -alwaysHex.length);
			const onetimePolicyId = onetimeAsset.unit.slice(0, -onetimeHex.length);

			setStatus('Selecting collateral...');

			const collateral = await wallet.getCollateral();
			if (!collateral || collateral.length === 0) {
				setStatus(
					'Error: No collateral available. Your wallet needs to set up collateral UTXOs. Please check your wallet settings.',
				);
				setLoading(false);
				return;
			}

			setStatus('Building transaction...');

			const utxos = await wallet.getUtxos();

			const alwaysUtxo = utxos.find((utxo: any) => {
				return utxo.output?.amount?.some((a: any) => a.unit === alwaysAsset.unit);
			});

			const onetimeUtxo = utxos.find((utxo: any) => {
				return utxo.output?.amount?.some((a: any) => a.unit === onetimeAsset.unit);
			});

			if (!alwaysUtxo || !onetimeUtxo) {
				setStatus('Error: Could not find UTXOs containing the tokens to burn.');
				setLoading(false);
				return;
			}

			setStatus('Building transaction...');

			const tx = new Transaction({ initiator: wallet });

			tx.setCollateral(collateral);

			const walletAddress = await wallet.getChangeAddress();
			tx.setRequiredSigners([walletAddress]);

			tx.mintAsset(
				policyScript,
				{
					assetName: ASSET_NAMES.ALWAYS,
					assetQuantity: '-1',
				},
				{
					data: 'd87980',
				},
			);

			tx.mintAsset(
				policyScript,
				{
					assetName: ASSET_NAMES.ONETIME,
					assetQuantity: '-1',
				},
				{
					data: 'd87980',
				},
			);

			tx.mintAsset(
				policyScript,
				{
					assetName: ASSET_NAMES.FENIX,
					assetQuantity: '1',
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
				<Flame className="w-6 h-6 text-gold" strokeWidth={1.5} />
				<h3 className="text-lg sm:text-xl font-bold text-gold">"fenix" Token</h3>
			</div>
			<p className="text-ivory/70 mb-4 text-xs sm:text-sm">Burn "always" and "onetime" to create "fenix".</p>

			<div className="flex flex-col gap-4">
				<div className="p-3 border border-orange-500/30 rounded bg-orange-900/10 text-ivory/80 text-xs flex items-start gap-2">
					<AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
					<div>
						<p className="text-orange-400 font-semibold mb-1">Burn Required</p>
						<p>Both "always" and "onetime" tokens will be burned.</p>
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
						<span>Mint "fenix" Token</span>
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
