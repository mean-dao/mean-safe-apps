import { AnchorProvider, Idl, Program, BN, utils } from "@project-serum/anchor";
import {
	Commitment,
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	SYSVAR_RENT_PUBKEY,
	TransactionInstruction,
} from "@solana/web3.js";
import {
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
	Token,
	MintLayout,
	MintInfo,
} from "@solana/spl-token";
import * as credixIdl from "./definition.json";

const gatewwayProgramPubKey = new PublicKey(
	"gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
);
const credixProgram = new PublicKey(
	"CRDx2YkdtYtGZXGHZ59wNv1EwKHQndnRc1gT4p8i2vPX"
);

const DEFAULT_MARKET_PLACE = "credix-marketplace";
const DEFAULT_TEST_MARKET_PLACE = "credix-test-marketplace";

export const createProgram = (
	connection: Connection,
	commitment?: Commitment
): Program<Idl> => {
	const opts = {
		skipPreflight: false,
		commitment: commitment || "confirmed",
		preflightCommitment: commitment || "confirmed",
		maxRetries: 3,
	};

	const readOnlyWallet = Keypair.generate();
	const anchorWallet = {
		publicKey: new PublicKey(readOnlyWallet.publicKey),
		signAllTransactions: async (txs: any) => txs,
		signTransaction: async (tx: any) => tx,
	};

	const provider = new AnchorProvider(connection, anchorWallet, opts);

	return new Program(credixIdl as Idl, credixProgram, provider);
};

export const getDepositIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	amount: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const marketSeed = Buffer.from(
		utils.bytes.utf8.encode(marketName || DEFAULT_MARKET_PLACE)
	);
	const [marketAddress] = await PublicKey.findProgramAddress(
		[marketSeed],
		program.programId
	);
	const globalMarketAccount =
		await program.account.globalMarketState.fetchNullable(marketAddress);

	if (!globalMarketAccount) {
		throw Error("Market not found.");
	}

	const [signingAuthority] = await PublicKey.findProgramAddress(
		[marketAddress.toBuffer()],
		program.programId
	);

	const investorTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.baseTokenMint as PublicKey,
		investor,
		true
	);

	const liquidityPoolTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.baseTokenMint as PublicKey,
		signingAuthority,
		true
	);

	const investorLPTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.lpTokenMint as PublicKey,
		investor,
		true
	);

	const credixSeed = Buffer.from(utils.bytes.utf8.encode("credix-pass"));
	const credixPassSeeds = [
		marketAddress.toBuffer(),
		investor.toBuffer(),
		credixSeed,
	];
	const [credixPass] = await PublicKey.findProgramAddress(
		credixPassSeeds,
		program.programId
	);
	const baseTokenMintInfo = await program.provider.connection.getAccountInfo(
		globalMarketAccount.baseTokenMint as PublicKey
	);

	if (!baseTokenMintInfo) {
		throw Error("Mint not found.");
	}

	const baseTokenMintAccount = MintLayout.decode(
		baseTokenMintInfo.data
	) as MintInfo;
	const depositAmount = new BN(amount * 10 ** baseTokenMintAccount.decimals);

	return await program.methods
		.depositFunds(depositAmount)
		.accounts({
			investor,
			globalMarketState: marketAddress,
			signingAuthority: signingAuthority,
			investorTokenAccount: investorTokenAccount,
			liquidityPoolTokenAccount: liquidityPoolTokenAccount,
			lpTokenMint: globalMarketAccount.lpTokenMint as PublicKey,
			investorLpTokenAccount: investorLPTokenAccount,
			credixPass: credixPass,
			baseTokenMint: globalMarketAccount.baseTokenMint as PublicKey,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			rent: SYSVAR_RENT_PUBKEY,
			tokenProgram: TOKEN_PROGRAM_ID,
			systenProgram: SystemProgram.programId,
		})
		.instruction();
};

export const getWithdrawIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	amount: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const marketSeed = Buffer.from(
		utils.bytes.utf8.encode(marketName || DEFAULT_MARKET_PLACE)
	);
	const [marketAddress] = await PublicKey.findProgramAddress(
		[marketSeed],
		program.programId
	);
	const globalMarketAccount =
		await program.account.globalMarketState.fetchNullable(marketAddress);

	if (!globalMarketAccount) {
		throw Error("Market not found.");
	}

	const [signingAuthority] = await PublicKey.findProgramAddress(
		[marketAddress.toBuffer()],
		program.programId
	);

	const investorTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.baseTokenMint as PublicKey,
		investor,
		true
	);

	const liquidityPoolTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.baseTokenMint as PublicKey,
		signingAuthority,
		true
	);

	const investorLPTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.lpTokenMint as PublicKey,
		investor,
		true
	);

	const credixSeed = Buffer.from(utils.bytes.utf8.encode("credix-pass"));
	const credixPassSeeds = [
		marketAddress.toBuffer(),
		investor.toBuffer(),
		credixSeed,
	];
	const [credixPass] = await PublicKey.findProgramAddress(
		credixPassSeeds,
		program.programId
	);
	const baseTokenMintInfo = await program.provider.connection.getAccountInfo(
		globalMarketAccount.baseTokenMint as PublicKey
	);

	if (!baseTokenMintInfo) {
		throw Error("Mint not found.");
	}

	const baseTokenMintAccount = MintLayout.decode(
		baseTokenMintInfo.data
	) as MintInfo;
	const depositAmount = new BN(amount * 10 ** baseTokenMintAccount.decimals);
	const withdrawalAmount = new BN(amount * 10 ** baseTokenMintAccount.decimals);

	return await program.methods
		.withdrawFunds(withdrawalAmount)
		.accounts({
			investor: investor,
			globalMarketState: marketAddress,
			signingAuthority: signingAuthority,
			investorLpTokenAccount: investorLPTokenAccount,
			investorTokenAccount: investorTokenAccount,
			liquidityPoolTokenAccount: liquidityPoolTokenAccount,
			treasuryPoolTokenAccount:
				globalMarketAccount.treasuryPoolTokenAccount as PublicKey,
			lpTokenMint: globalMarketAccount.lpTokenMint as PublicKey,
			credixPass: credixPass,
			baseTokenMint: globalMarketAccount.baseTokenMint as PublicKey,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
		})
		.instruction();
};

export const getTrancheDepositIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	deal: PublicKey,
	amount: number,
	trancheIndex: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const marketSeed = Buffer.from(
		utils.bytes.utf8.encode(marketName || DEFAULT_MARKET_PLACE)
	);
	const [marketAddress] = await PublicKey.findProgramAddress(
		[marketSeed],
		program.programId
	);
	const globalMarketAccount =
		await program.account.globalMarketState.fetchNullable(marketAddress);

	if (!globalMarketAccount) {
		throw Error("Market not found.");
	}

	const [signingAuthority] = await PublicKey.findProgramAddress(
		[marketAddress.toBuffer()],
		program.programId
	);

	const investorTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.baseTokenMint as PublicKey,
		investor,
		true
	);

	const [tranchePassPda] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			investor.toBuffer(),
			deal.toBuffer(),
			new BN(trancheIndex).toArrayLike(Buffer, "le", 1),
			Buffer.from(utils.bytes.utf8.encode("tranche-pass")),
		],
		program.programId
	);

	const [tranchesPda] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			deal.toBuffer(),
			Buffer.from(utils.bytes.utf8.encode("tranches")),
		],
		program.programId
	);

	const [trancheMintPda] = await PublicKey.findProgramAddress(
		[
			tranchesPda.toBuffer(),
			new BN(trancheIndex).toArrayLike(Buffer, "le", 1),
			Buffer.from(utils.bytes.utf8.encode("tranche-mint")),
		],
		program.programId
	);

	const [repaymentSchedulePda] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			deal.toBuffer(),
			Buffer.from(utils.bytes.utf8.encode("repayment-schedule")),
		],
		program.programId
	);

	const [dealTokenAccount] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			deal.toBuffer(),
			Buffer.from(utils.bytes.utf8.encode("deal-token-account")),
		],
		program.programId
	);

	const depositAmount = new BN(amount * 10 ** 6);

	const investorAssociatedTrancheMintAccount =
		await Token.getAssociatedTokenAddress(
			ASSOCIATED_TOKEN_PROGRAM_ID,
			TOKEN_PROGRAM_ID,
			trancheMintPda,
			investor,
			true
		);

	return await program.methods
		.depositTranche(depositAmount, trancheIndex)
		.accounts({
			investor: investor,
			tranchePass: tranchePassPda,
			deal: deal,
			dealTranches: tranchesPda,
			trancheTokenMint: trancheMintPda,
			repaymentSchedule: repaymentSchedulePda,
			dealTokenAccount: dealTokenAccount,
			investorBaseAccount: investorTokenAccount,
			investorTrancheTokenAccount: investorAssociatedTrancheMintAccount,
			baseTokenMint: globalMarketAccount.baseTokenMint as PublicKey,
			signingAuthority: signingAuthority,
			globalMarketState: marketAddress,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			rent: SYSVAR_RENT_PUBKEY,
		})
		.instruction();
};

export const getTrancheWithdrawIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	deal: PublicKey,
	amount: number,
	trancheIndex: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const marketSeed = Buffer.from(
		utils.bytes.utf8.encode(marketName || DEFAULT_MARKET_PLACE)
	);
	const [marketAddress] = await PublicKey.findProgramAddress(
		[marketSeed],
		program.programId
	);
	const globalMarketAccount =
		await program.account.globalMarketState.fetchNullable(marketAddress);

	if (!globalMarketAccount) {
		throw Error("Market not found.");
	}

	const [signingAuthority] = await PublicKey.findProgramAddress(
		[marketAddress.toBuffer()],
		program.programId
	);

	const investorTokenAccount = await Token.getAssociatedTokenAddress(
		ASSOCIATED_TOKEN_PROGRAM_ID,
		TOKEN_PROGRAM_ID,
		globalMarketAccount.baseTokenMint as PublicKey,
		investor,
		true
	);

	const [tranchePassPda] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			investor.toBuffer(),
			deal.toBuffer(),
			new BN(trancheIndex).toArrayLike(Buffer, "le", 1),
			Buffer.from(utils.bytes.utf8.encode("tranche-pass")),
		],
		program.programId
	);

	const [tranchesPda] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			deal.toBuffer(),
			Buffer.from(utils.bytes.utf8.encode("tranches")),
		],
		program.programId
	);

	const [trancheMintPda] = await PublicKey.findProgramAddress(
		[
			tranchesPda.toBuffer(),
			new BN(trancheIndex).toArrayLike(Buffer, "le", 1),
			Buffer.from(utils.bytes.utf8.encode("tranche-mint")),
		],
		program.programId
	);

	const [repaymentSchedulePda] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			deal.toBuffer(),
			Buffer.from(utils.bytes.utf8.encode("repayment-schedule")),
		],
		program.programId
	);

	const [dealTokenAccount] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			deal.toBuffer(),
			Buffer.from(utils.bytes.utf8.encode("deal-token-account")),
		],
		program.programId
	);

	const [investorTranche] = await PublicKey.findProgramAddress(
		[
			marketAddress.toBuffer(),
			investor.toBuffer(),
			deal.toBuffer(),
			new BN(trancheIndex).toArrayLike(Buffer, "le", 1),
			Buffer.from(utils.bytes.utf8.encode("tranche")),
		],
		program.programId
	);

	const withdrawAmount = new BN(amount * 10 ** 6);

	const investorAssociatedTrancheMintAccount =
		await Token.getAssociatedTokenAddress(
			ASSOCIATED_TOKEN_PROGRAM_ID,
			TOKEN_PROGRAM_ID,
			trancheMintPda,
			investor,
			true
		);

	return await program.methods
		.withdrawTranche(trancheIndex, withdrawAmount)
		.accounts({
			investor: investor,
			tranchePass: tranchePassPda,
			deal: deal,
			investorTranche: investorTranche,
			dealTranches: tranchesPda,
			trancheTokenMint: trancheMintPda,
			repaymentSchedule: repaymentSchedulePda,
			dealTokenAccount: dealTokenAccount,
			investorBaseAccount: investorTokenAccount,
			investorTrancheTokenAccount: investorAssociatedTrancheMintAccount,
			baseTokenMint: globalMarketAccount.baseTokenMint as PublicKey,
			signingAuthority: signingAuthority,
			globalMarketState: marketAddress,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			rent: SYSVAR_RENT_PUBKEY,
		})
		.instruction();
};
