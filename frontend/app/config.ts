export const MINTING_CONFIG = {
	policyId: process.env.NEXT_PUBLIC_POLICY_ID || '',

	ownerVkh: process.env.NEXT_PUBLIC_OWNER_VKH || 'YOUR_OWNER_VKH_HERE',

	onetimeUtxoRef: {
		transactionId: process.env.NEXT_PUBLIC_UTXO_TX_ID || 'YOUR_TX_ID_HERE',
		outputIndex: parseInt(process.env.NEXT_PUBLIC_UTXO_INDEX || '0'),
	},

	network: process.env.NEXT_PUBLIC_NETWORK || 'preprod',

	blockfrostKey: process.env.NEXT_PUBLIC_BLOCKFROST_KEY || '',

	unparameterizedScript: '',
};

export const ASSET_NAMES = {
	ALWAYS: 'always',
	ONETIME: 'onetime',
	FENIX: 'fenix',
};
