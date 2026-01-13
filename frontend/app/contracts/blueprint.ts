import blueprint from './plutus.json';

export function getMintingValidator() {
	const validator = blueprint.validators.find((v) => v.title === 'minting.mint.mint');

	if (!validator) {
		throw new Error('Minting validator not found in blueprint');
	}

	return validator;
}

export function getPolicyId(): string {
	return getMintingValidator().hash;
}

export function getCompiledCode(): string {
	return getMintingValidator().compiledCode;
}

