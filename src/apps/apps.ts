import { PublicKey, SystemProgram } from "@solana/web3.js";
import { fetch } from "cross-fetch";
import data from './apps.json';

export enum NETWORK {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

export type UiElementVisibility = "show" | "hide" | "readOnly";

export type UiType = 
    "yesOrNo"
  | "option"
  | "optionOwners"
  | "optionAccounts"
  | "inputText"
  | "inputTextArea"
  | "inputNumber"
  | "datePicker"
  | "slot"
  | "knownValue"
  | "treasuryAccount"
  | "txProposer";

export type App = {
  id: string;
  name: string;
  network: NETWORK;
  logoUri: string;
  definition: any;
  uiElements: UiElement[];
}

export type UiElement = {
  id: string,
  name: string;
  label: string;
  help: string;
  type: UiType;
  value: any;
  visibility: UiElementVisibility,
  dataElement: DataElement | undefined,
}

export type Account = {
  index: number;
  name: string;
  isSigner: boolean;
  isWritable: boolean;
}

export type Arg = {
  position: number;
  name: string;
  dataType: any;
}

export type DataElement = Account | Arg;

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
    const response = await fetch(data.definition);
    const result = (await response.json()) as any;
    let program = {
      id: data.id,
      name: data.name,
      network: data.network,
      logoUri: data.logo,
      definition: result,
      uiElements: []
    } as App;
    let uiElements: UiElement[] = [];
    for (let uiIx of data.instructions) {
      const dataIx = result.instructions.filter((ix: any) => ix.name === uiIx.name)[0];
      if (dataIx) {
        const ix = await parseInstruction(program.id, uiIx, dataIx);
        if (ix) {
          uiElements.push(ix);
        }
      }
    }
    program.uiElements = uiElements;
    return program;  
  } catch {
    return null;
  }
};

const parseInstruction = async (programId: string, uiIx: any, dataIx: any): Promise<UiElement | null> => {
  try {
    const ixId = (await PublicKey.findProgramAddress(
      [Buffer.from(uiIx.name)],
      new PublicKey(programId)
    ))[0].toBase58();
    let element = {
      id: ixId,
      name: uiIx.name,
      label: uiIx.label,
      help: uiIx.help,
      type: uiIx.type,
      value: uiIx.value,
      visibility: uiIx.visibility,
      dataElement: undefined      
    } as UiElement;
    // accounts
    let accIndex = 0, argPosition = 0;
    for (let uiElem of uiIx.uiElements) {
      let dataElem = dataIx.accounts.filter((acc: any) => acc.name === uiElem.name)[0];
      if (dataElem) {
        element.dataElement = {
          index: accIndex,
          name: dataElem.name,
          isWritable: dataElem.isMut,
          isSigner: dataElem.isSigner
        } as Account;
        accIndex ++;
      } else {
        dataElem = dataIx.args.filter((arg: any) => arg.name === uiElem.name)[0];
        element.dataElement = {
          position: argPosition,
          name: dataElem.name,
          dataType: dataElem.type
        } as Arg;
        argPosition ++;
      }
    }
    return element;  
  } catch {
    return null;
  }
};