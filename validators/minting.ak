use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}
use cardano/transaction.{Input, OutputReference, Transaction}

validator mint(owner: VerificationKeyHash, utxo_ref: OutputReference) {
  mint(_redeemer: Data, policy_id: PolicyId, transaction: Transaction) {
    let Transaction { mint, inputs, extra_signatories, .. } = transaction

    let minted_assets =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    let is_burning_always =
      list.any(
        minted_assets,
        fn(asset) {
          let Pair(name, amount) = asset
          name == "always" && amount < 0
        },
      )

    let is_burning_onetime =
      list.any(
        minted_assets,
        fn(asset) {
          let Pair(name, amount) = asset
          name == "onetime" && amount < 0
        },
      )

    let check_asset =
      fn(asset) {
        let Pair(name, amount) = asset
        if name == "always" {
          True
        } else if name == "onetime" {
          if amount > 0 {
            let is_signed = list.has(extra_signatories, owner)
            let is_utxo_consumed =
              list.any(inputs, fn(input) { input.output_reference == utxo_ref })
            is_signed && is_utxo_consumed
          } else {
            True
          }
        } else if name == "fenix" {
          if amount > 0 {
            is_burning_always && is_burning_onetime
          } else {
            True
          }
        } else {
          False
        }
      }

    list.all(minted_assets, check_asset)
  }

  else(_) {
    fail
  }
}