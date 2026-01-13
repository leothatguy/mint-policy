import { useState, useMemo } from 'react';
import { resolvePaymentKeyHash, PlutusScript } from '@meshsdk/core';
import { useWallet } from './useWallet';
import { MINTING_CONFIG } from '../config';
import { getParameterizedPolicyScript, getPolicyIdFromScript } from '../contracts/utils';

export function useMintingPolicy() {
	const { wallet, address, connected } = useWallet();
	const [parameterizedScript, setParameterizedScript] = useState<PlutusScript | null>(null);
	const [policyId, setPolicyId] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const ownerVkh = useMemo(() => {
		if (!address) return null;
		try {
			return resolvePaymentKeyHash(address);
		} catch (err) {
			console.error('Failed to extract owner VKH:', err);
			return null;
		}
	}, [address]);

	const isConfigComplete = useMemo(() => {
		const hasOwnerVkh = 
			(MINTING_CONFIG.ownerVkh !== 'YOUR_OWNER_VKH_HERE' && MINTING_CONFIG.ownerVkh !== '') || 
			ownerVkh !== null;
		
		const hasUtxoRef = 
			MINTING_CONFIG.onetimeUtxoRef.transactionId !== 'YOUR_TX_ID_HERE' &&
			MINTING_CONFIG.onetimeUtxoRef.transactionId !== '';

		return hasOwnerVkh && hasUtxoRef;
	}, [ownerVkh]);

	const parameterizeScript = async (): Promise<{ script: PlutusScript; policyId: string } | undefined> => {
		if (!isConfigComplete) {
			setError('Configuration incomplete. Please set owner VKH and UTXO reference.');
			return undefined;
		}

		setLoading(true);
		setError(null);

		try {
			const vkh = MINTING_CONFIG.ownerVkh !== 'YOUR_OWNER_VKH_HERE' && MINTING_CONFIG.ownerVkh !== ''
				? MINTING_CONFIG.ownerVkh 
				: ownerVkh;

			if (!vkh) {
				throw new Error('Owner VKH is not set. Please set it in config.ts or connect the owner wallet.');
			}

			const utxoRef = MINTING_CONFIG.onetimeUtxoRef;

			const script = await getParameterizedPolicyScript(vkh, utxoRef);
			setParameterizedScript(script);

			const pid = await getPolicyIdFromScript(script);
			setPolicyId(pid);

			return { script, policyId: pid };
		} catch (err: any) {
			const errorMsg = err.message || 'Failed to parameterize script';
			setError(errorMsg);
			console.error('Parameterization error:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		ownerVkh,
		parameterizedScript,
		policyId: policyId || '',
		isConfigComplete,
		loading,
		error,
		parameterizeScript,
	};
}

