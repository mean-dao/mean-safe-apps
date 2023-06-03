import { AnchorProvider, Idl, Program, BN, utils } from "@coral-xyz/anchor";
import { CredixClient } from "@credix/credix-client";
import {
	Commitment,
	ConfirmOptions,
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
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

const credixProgram = new PublicKey(
	"CRDx2YkdtYtGZXGHZ59wNv1EwKHQndnRc1gT4p8i2vPX"
);

const DEFAULT_MARKET_PLACE = "credix-marketplace";

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

const createClient = (program: Program<Idl>) => {
	const connection = program.provider.connection;
	const readOnlyWallet = Keypair.generate();
	const anchorWallet = {
		publicKey: new PublicKey(readOnlyWallet.publicKey),
		signAllTransactions: async (txs: any) => txs,
		signTransaction: async (tx: any) => tx,
	};

	const confirmOptions: ConfirmOptions = {
		commitment: "confirmed",
		preflightCommitment: "processed",
	};
	const programId = new PublicKey(
		"CRDx2YkdtYtGZXGHZ59wNv1EwKHQndnRc1gT4p8i2vPX"
	);
	const secondaryMarketProgramId = new PublicKey(
		"MSMTVTYZXBGJB1SCViC4yGY17tcF2S9meV7iGTyfoAn"
	);

	const config = {
		programId: programId,
		secondaryMarketProgramId,
		confirmOptions: confirmOptions,
	};

	return new CredixClient(connection, anchorWallet as NodeWallet, config);
};

export const getDepositIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	amount: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const client = createClient(program);
	const market = await client.fetchMarket(marketName);

	if (!market) {
		throw Error("Market not found.");
	}

	const depositIx = await market?.depositIx(amount * 10 ** 6, investor);

	return depositIx;
};

export const getCreateWithdrawRequestIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	amount: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const client = createClient(program);
	const market = await client.fetchMarket(marketName);

	if (!market) {
		throw Error("Market not found.");
	}

	const latestWithdrawEpoch = await market.fetchLatestWithdrawEpoch();
	const createWithdrawRequestIx =
		await latestWithdrawEpoch.createWithdrawRequestIx(
			amount * 10 ** 6,
			investor
		);

	return createWithdrawRequestIx;
};

export const getRedeemRequestIx = async (
	program: Program<Idl>,
	investor: PublicKey,
	amount: number,
	marketName: string | undefined = DEFAULT_MARKET_PLACE
): Promise<TransactionInstruction> => {
	const client = createClient(program);
	const market = await client.fetchMarket(marketName);

	if (!market) {
		throw Error("Market not found.");
	}

	const latestWithdrawEpoch = await market.fetchLatestWithdrawEpoch();
	const redeemRequestIx = await latestWithdrawEpoch.redeemRequestIx(
		amount * 10 ** 6,
		investor
	);

	return redeemRequestIx;
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
			// we pass the credix program ID; which will be perceived by Anchor as an optional account for which the value is null.
			trancheInfo: credixProgram,
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
			// we pass the credix program ID; which will be perceived by Anchor as an optional account for which the value is null.
			trancheInfo: credixProgram,
			signingAuthority: signingAuthority,
			globalMarketState: marketAddress,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			tokenProgram: TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			rent: SYSVAR_RENT_PUBKEY,
		})
		.instruction();
};
