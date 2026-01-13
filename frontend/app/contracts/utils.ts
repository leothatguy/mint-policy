import { mConStr0, PlutusScript } from '@meshsdk/core';
import { getCompiledCode } from './blueprint';

let applyParamsToScript: any = null;
let cslLoadPromise: Promise<any> | null = null;

const loadCSL = async () => {
	if (applyParamsToScript) {
		return applyParamsToScript;
	}

	if (typeof window === 'undefined') {
		console.warn('[Utils] Not in browser environment, CSL cannot load');
		return null;
	}

	if (cslLoadPromise) {
		await cslLoadPromise;
		return applyParamsToScript;
	}

	cslLoadPromise = (async () => {
		try {
			const csl = await import('@meshsdk/core-csl');
			applyParamsToScript = csl.applyParamsToScript;
			return applyParamsToScript;
		} catch (error) {
			console.error('[Utils] Failed to load CSL module:', error);
			cslLoadPromise = null;
			return null;
		}
	})();

	return await cslLoadPromise;
};


export async function getParameterizedPolicyScript(
	ownerVkh: string,
	utxoRef: { transactionId: string; outputIndex: number },
): Promise<PlutusScript> {
	const applyParams = await loadCSL();

	if (!applyParams) {
		throw new Error(
			'applyParamsToScript is not available. This function must be called on the client side. Make sure the CSL WASM module is loaded.',
		);
	}

	const compiledCode = getCompiledCode();

	const ownerParam = ownerVkh; // Pass as hex string


	const txIdHex = utxoRef.transactionId;
	const outputIndex = utxoRef.outputIndex;
	const utxoRefParam = mConStr0([txIdHex, outputIndex]);

	const parameterizedScriptCbor = applyParams(compiledCode, [ownerParam, utxoRefParam]);

	const plutusScript: PlutusScript = {
		code: parameterizedScriptCbor,
		version: 'V3',
	};

	return plutusScript;
}

export async function getPolicyIdFromScript(script: PlutusScript | string): Promise<string> {
	const crypto = await import('crypto');

	const scriptCbor = typeof script === 'string' ? script : script.code;

	const scriptBytes = Buffer.from(scriptCbor, 'hex');
	const hash = crypto.createHash('sha256').update(scriptBytes).digest('hex');
	return hash.substring(0, 56); // 28 bytes = 56 hex chars
}
