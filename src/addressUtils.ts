import {
  Address,
  AddressHeaderKind,
  BaseAddress,
  BigNum,
  ConstrPlutusData,
  Ed25519KeyHash,
  EnterpriseAddress,
  PlutusData,
  StakeCredential,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { Maybe } from "./Maybe";
import { plutus_list_from_list } from "./util";

function credential_to_staking_credential(cred: ConstrPlutusData): StakeCredential {
  if (cred.alternative().to_str() === "0") {
    return StakeCredential.from_keyhash(Ed25519KeyHash.from_bytes(cred.data().get(0).as_bytes()!));
  } else if (cred.alternative().to_str() === "1") {
    return StakeCredential.from_scripthash(Ed25519KeyHash.from_bytes(cred.data().get(0).as_bytes()!));
  } else {
    throw new Error("[address] Unknown address credential");
  }
}

function pubkey_credential_to_plutus_data(cred: StakeCredential) {
  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(
      BigNum.from_str("0"),
      plutus_list_from_list([PlutusData.new_bytes(cred.to_keyhash()!.to_bytes())])
    )
  );
}

function script_credential_to_plutus_data(cred: StakeCredential) {
  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(
      BigNum.from_str("1"),
      plutus_list_from_list([PlutusData.new_bytes(cred.to_scripthash()!.to_bytes())])
    )
  );
}

function stakekey_credential_to_plutus_data(cred: StakeCredential) {
  return Maybe.just(
    PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("0"),
        plutus_list_from_list([pubkey_credential_to_plutus_data(cred)])
      )
    )
  );
}

function stakescript_credential_to_plutus_data(cred: StakeCredential) {
  return Maybe.just(
    PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(
        BigNum.from_str("0"),
        plutus_list_from_list([script_credential_to_plutus_data(cred)])
      )
    )
  );
}

export function address_from_plutus_data(networkId: number, data: PlutusData): Address {
  const constrData = data.as_constr_plutus_data();
  if (!constrData || constrData.alternative().to_str() !== "0") {
    throw new Error("[address] incorrect address cred");
  }
  const addrCred = constrData.data().get(0).as_constr_plutus_data();
  const maybeStakingCred = constrData.data().get(1).as_constr_plutus_data();

  if (!addrCred || !maybeStakingCred) {
    throw new Error("[address] missing paymentCred or maybestakingCred");
  }

  if (maybeStakingCred.alternative().to_str() === "1") {
    return EnterpriseAddress.new(networkId, credential_to_staking_credential(addrCred)).to_address();
  }

  const stakingCred = maybeStakingCred.data().get(0).as_constr_plutus_data();

  if (!stakingCred || stakingCred.alternative().to_str() !== "0") {
    /**
     * 0 = staking hash
     * 1 = staking ptr
     */
    throw new Error("[address] Unsupported staking cred format - pointer");
  }

  const stakingHashCred = stakingCred.data().get(0).as_constr_plutus_data();

  if (!stakingHashCred) {
    throw new Error("[address] Unsupported staking hash address");
  }

  return BaseAddress.new(
    networkId,
    credential_to_staking_credential(addrCred),
    credential_to_staking_credential(stakingHashCred)
  ).to_address();
}

export function address_to_plutus_data(address: Address) {
  let fields: PlutusData[];
  switch (true) {
    case Address.header_matches_kind(address.header(), AddressHeaderKind.BasePaymentKeyStakeKey): {
      const baseAddr = address.as_base()!;
      fields = [
        pubkey_credential_to_plutus_data(baseAddr.payment_cred()),
        stakekey_credential_to_plutus_data(baseAddr.stake_cred()),
      ];
      break;
    }
    case Address.header_matches_kind(address.header(), AddressHeaderKind.BasePaymentScriptStakeKey): {
      const baseAddr = address.as_base()!;
      fields = [
        script_credential_to_plutus_data(baseAddr.payment_cred()),
        stakekey_credential_to_plutus_data(baseAddr.stake_cred()),
      ];
      break;
    }
    case Address.header_matches_kind(address.header(), AddressHeaderKind.BasePaymentScriptStakeScript): {
      const baseAddr = address.as_base()!;
      fields = [
        script_credential_to_plutus_data(baseAddr.payment_cred()),
        stakescript_credential_to_plutus_data(baseAddr.stake_cred()),
      ];
      break;
    }
    case Address.header_matches_kind(address.header(), AddressHeaderKind.EnterpriseScript): {
      const enterpriseAddress = address.as_enterprise()!;
      fields = [script_credential_to_plutus_data(enterpriseAddress.payment_cred())];
      break;
    }
    default:
      throw new Error("[address] Unsupported address type");
  }
  return PlutusData.new_constr_plutus_data(
    ConstrPlutusData.new(BigNum.from_str("0"), plutus_list_from_list(fields))
  );
}
