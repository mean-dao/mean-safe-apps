import { PublicKey } from "@solana/web3.js";
import { fetch } from "cross-fetch";
import data from './apps.json';

export enum NETWORK {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

export type UiType =
  | "Boolean"
  | "Enum"
  | "Small"
  | "Number"
  | "Big"
  | "Float"
  | "String"
  | "PublicKey"
  | "Date"
  | "Object"
  | "Array";

export interface App {
  id: string;
  name: string;
  network: NETWORK;
  logoUri: string;
  instructions: Instruction[];
}

export interface Instruction {
  id: string;
  name: string;
  label: string;
  args: Arg[];
  accounts: Account[];
  remainingAccounts: Account[];
}

export interface Account {
  index: number;
  name: string;
  label: string;
  isSigner: boolean;
  isWritable: boolean;
}

export interface Arg {
  position: number;
  name: string;
  label: string;
  uiType: string;
  dataType: string;
}

export class AppsProvider {

  network?: NETWORK;

  constructor(network?: NETWORK) {
    this.network = network;
  }

  getApps = async (): Promise<App[]> => {
    let programs: App[] = [];
    const apps = getApps(this.network);
    for (let item of apps) {
      const program = await parseApp(item);
      if (program) {
        programs.push(program);
      }
    }
    return programs;
  };
}

const getApps = (network?: NETWORK) => {
  if (!network) { return data.apps; }
  return data.apps.filter((a: any) => a.network == network);
};

const parseApp = async (data: any): Promise<App | null> => {
  try {
    let program = {
      id: data.id,
      name: data.name,
      network: data.network,
      logoUri: data.logo,
      instructions: []
    } as App;
    const response = await fetch(data.definition);
    const result = (await response.json()) as any;
    let instructions: Instruction[] = [];
    for (let uiIx of data.instructions) {
      const dataIx = result.instructions.filter((ix: any) => ix.name === uiIx.name)[0];
      if (dataIx) {
        const ix = await parseInstruction(program.id, uiIx, dataIx);
        if (ix) {
          instructions.push(ix);
        }
      }
    }
    program.instructions = instructions;
    return program;  
  } catch {
    return null;
  }
};

const parseInstruction = async (programId: string, uiIx: any, dataIx: any): Promise<Instruction | null> => {
  try {
    let instruction = {
      id: (await PublicKey.findProgramAddress(
        [Buffer.from(uiIx.name)],
        new PublicKey(programId)
      ))[0].toBase58(),
      name: uiIx.name,
      label: uiIx.label,
      accounts: [],
      remainingAccounts: [],
      args: []
    } as Instruction;
    // accounts
    let accIndex = 0;
    for (let uiAcc of uiIx.accounts) {
      let dataAcc = dataIx.accounts.filter((acc: any) => acc.name === uiAcc.name)[0];
      if (dataAcc) {
        instruction.accounts.push({
          index: accIndex,
          label: uiAcc.label,
          name: dataAcc.name,
          isWritable: dataAcc.isMut,
          isSigner: dataAcc.isSigner
        } as Account);
        accIndex ++;
      }
    }
    // args
    let argPosition = 0;
    for (let uiArg of uiIx.args) {
      const dataArg = dataIx.args.filter((arg: any) => arg.name === uiArg.name)[0];
      if (dataArg) {
        const arg = {
          position: argPosition,
          name: dataArg.name,
          label: uiArg.label,
          uiType: getUiType(uiArg.type),
          dataType: dataArg.type
        } as Arg;
        instruction.args.push(arg);
        argPosition ++;
      }
    }
    return instruction;  
  } catch {
    return null;
  }
};

const getUiType = (type: UiType): string => {
  if (
    type === "Small" || 
    type === "Number" || 
    type === "Big" || 
    type === "Float"
  ) {
    return "Number";
  }
  if (type === "String" || type === "PublicKey") {
    return "String";
  }
  return `${type[0].toUpperCase()}${type.substring(1)}`;
}