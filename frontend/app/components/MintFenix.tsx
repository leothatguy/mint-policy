'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMintingPolicy } from '../hooks/useMintingPolicy';
import { Lucid, Blockfrost, Data, fromText, mintingPolicyToId } from '@lucid-evolution/lucid';
import { MINTING_CONFIG, ASSET_NAMES } from '../config';
import { Flame, Loader2, AlertTriangle } from 'lucide-react';

export function MintFenix() {
	const { wallet, connected } = useWallet();
	const { parameterizeScript, policyId: meshPolicyId, isConfigComplete, error: policyError } = useMintingPolicy();
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
			const { script: policyScript } = result;

			// We will calculate policy ID using Lucid to ensure it matches

			setStatus('Checking for required tokens...');

			const assets = await wallet.getAssets();

			// Convert asset names to hex for comparison
			const alwaysHex = Buffer.from(ASSET_NAMES.ALWAYS, 'utf8').toString('hex');
			const onetimeHex = Buffer.from(ASSET_NAMES.ONETIME, 'utf8').toString('hex');

			// Find tokens by asset name (regardless of policy ID)
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

			setStatus('Building transaction with Lucid...');

			// Initialize Lucid with Blockfrost provider
			// Try using the default export or checking what Lucid is
			// Based on error, Lucid might be an object with factory methods in TS types, but function at runtime?
			// Let's try instantiating it if it's a class, or calling if function.
			// Reverting to Lucid() call but casting to any to bypass TS error for now to check runtime behavior
			// Also checking if we need to call .init() or similar

			const lucid = await (Lucid as any)(
				new Blockfrost(MINTING_CONFIG.blockfrostUrl, MINTING_CONFIG.blockfrostKey),
				'Preprod',
			);

			// Connect wallet to Lucid
			const savedWalletName = localStorage.getItem('connectedWallet');
			if (!savedWalletName) {
				throw new Error('No wallet name found in localStorage');
			}
			const walletApi = await (window as any).cardano[savedWalletName.toLowerCase()].enable();
			lucid.selectWallet.fromAPI(walletApi);

			// Convert asset names to hex using Lucid's fromText
			const alwaysAssetName = fromText(ASSET_NAMES.ALWAYS);
			const onetimeAssetName = fromText(ASSET_NAMES.ONETIME);
			const fenixAssetName = fromText(ASSET_NAMES.FENIX);

			// Convert Mesh script format to Lucid format
			const lucidScript = {
				type: 'PlutusV3' as any,
				script: policyScript.code,
			};

			// CRITICAL: Calculate Policy ID using Lucid to ensure it matches the attached script
			const lucidPolicyId = mintingPolicyToId(lucidScript);
			console.log('Validating Policy IDs:');
			console.log('Mesh Policy ID (from hook):', meshPolicyId);
			console.log('Lucid Policy ID (from script):', lucidPolicyId);

			if (meshPolicyId && meshPolicyId !== lucidPolicyId) {
				console.warn('Policy ID mismatch! Using Lucid calculated ID.');
			}

			// Build minting transaction with Lucid
			// Lucid's mintAssets accepts an object with { [policyId + assetName]: quantity }
			const tx = await lucid
				.newTx()
				.mintAssets(
					{
						[lucidPolicyId + alwaysAssetName]: -1n, // Burn 1 always (BigInt)
						[lucidPolicyId + onetimeAssetName]: -1n, // Burn 1 onetime (BigInt)
						[lucidPolicyId + fenixAssetName]: 1n, // Mint 1 fenix (BigInt)
					},
					Data.void(),
				) // Empty redeemer
				.attach.MintingPolicy(lucidScript) // Evolution API syntax
				.complete();

			setStatus('Signing transaction...');
			const signedTx = await tx.sign.withWallet().complete();

			setStatus('Submitting transaction...');
			const txHash = await signedTx.submit();

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
