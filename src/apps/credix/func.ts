import { PublicKey } from "@solana/web3.js";
import { NETWORK } from "../../apps";

const owner = new PublicKey("63cUbJ3yecyduEPPYbPERPSJzAy6ZnRWvjE6u4qkkAVd");
const gatekeeperKeyMain = new PublicKey("ni1jXzPTq1yTqo67tUmVgnp22b1qGAAZCtPmHtskqYG"); // mainnet
const gatekeeperKeyDev = new PublicKey("tniC2HX5yg2yDjMQEcUo1bHa44x9YdZVSqyKox21SDz"); // devnet
const programPubKey = new PublicKey("gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs");

export const getGatewayToken = async (
  network: NETWORK,
  seed?: Uint8Array,
  
): Promise<PublicKey> => {

  const additionalSeed = seed
    ? Buffer.from(seed)
    : Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);

  if (additionalSeed.length != 8) {
    throw new Error(
      "Additional Seed has length " +
        additionalSeed.length +
        " instead of 8 when calling getGatewayTokenAddressForOwnerAndGatekeeperNetwork."
    );
  }

  const gatekeeperKey = network === NETWORK.MainnetBeta ? gatekeeperKeyMain : gatekeeperKeyDev;
  const seeds = [
    owner.toBuffer(),
    Buffer.from("gateway", "utf8"),
    additionalSeed,
    gatekeeperKey.toBuffer(),
  ];

  const [publicKey] = await PublicKey.findProgramAddress(seeds, programPubKey);
  
  return publicKey;
};

export const getGlobalMarketState = async (
  network: NETWORK
  
): Promise<PublicKey> => {

  //TODO: Implement
  
  return PublicKey.default;
};

export const getSigningAuthority = async (
  network: NETWORK
  
): Promise<PublicKey> => {

  //TODO: Implement
  
  return PublicKey.default;
};

export const getInvestorTokenAccount = async (
  network: NETWORK
  
): Promise<PublicKey> => {

  //TODO: Implement
  
  return PublicKey.default;
};

export const getLPTokenAccount = async (
  network: NETWORK
  
): Promise<PublicKey> => {

  //TODO: Implement
  
  return PublicKey.default;
};

export const getInvestorLPTokenAccount = async (
  network: NETWORK
  
): Promise<PublicKey> => {

  //TODO: Implement
  
  return PublicKey.default;
};
