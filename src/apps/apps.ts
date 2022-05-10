import { PublicKey } from "@solana/web3.js";
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
  uiInstructions: UiInstruction[];
}

export type UiInstruction = {
  id: string;
  name: string;
  label: string;
  uiElements: UiElement[];
}

export type UiElement = {
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
    let parsedApps: App[] = [];
    const apps = getApps(this.network);
    for (let item of apps) {
      const app = await parseApp(item);
      if (app) {
        parsedApps.push(app);
      }
    }
    return parsedApps;
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
    let app = {
      id: data.id,
      name: data.name,
      network: data.network,
      logoUri: data.logo,
      definition: result,
      uiInstructions: []
    } as App;
    let uiIxs: UiInstruction[] = [];
    for (let uiIx of data.uiInstructions) {
      const dataIx = result.instructions.filter((ix: any) => ix.name === uiIx.name)[0];
      if (dataIx) {
        const parsedIx = await parseUiInstruction(app.id, uiIx, dataIx);
        if (parsedIx) {
          uiIxs.push(parsedIx);
        }
      }
    }
    app.uiInstructions = uiIxs;
    return app;  
  } catch {
    return null;
  }
};

const parseUiInstruction = async (programId: string, uiIx: any, dataIx: any): Promise<UiInstruction | null> => {
  try {
    const ixId = (await PublicKey.findProgramAddress(
      [Buffer.from(uiIx.name)],
      new PublicKey(programId)
    ))[0].toBase58();
    let ix = {
      id: ixId,
      name: uiIx.name,
      label: uiIx.label,
      uiElements: []     
    } as UiInstruction;
    // accounts
    let accIndex = 0;
    for (let uiAcc of uiIx.accounts) {
      let dataElem = dataIx.accounts.filter((acc: any) => acc.name === uiAcc.name)[0];
      if (dataElem) {
        ix.uiElements.push({
          name: uiAcc.name,
          label: uiAcc.label,
          help: uiAcc.help,
          type: uiAcc.type,
          value: uiAcc.value,
          visibility: uiAcc.visibility,
          dataElement: {
            index: accIndex,
            name: dataElem.name,
            isWritable: dataElem.isMut,
            isSigner: dataElem.isSigner
          } as Account
        } as UiElement);
        accIndex ++;
      }
    }
    // args
    let argPosition = 0
    for (let uiArg of uiIx.args) {
      let dataElem = dataIx.args.filter((acc: any) => acc.name === uiArg.name)[0];
      if (dataElem) {
        ix.uiElements.push({
          name: uiArg.name,
          label: uiArg.label,
          help: uiArg.help,
          type: uiArg.type,
          value: uiArg.value,
          visibility: uiArg.visibility,
          dataElement: {
            position: argPosition,
            name: dataElem.name,
            dataType: dataElem.type
          } as Arg
        } as UiElement);
        argPosition ++;
      }
    }
    return ix;
  } catch {
    return null;
  }
};