import { PublicKey } from "@solana/web3.js";
import { fetch } from "cross-fetch";
import data from './apps.json';

export enum NETWORK {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

export type UiElementVisibility = "show" | "hide";

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
  | "txProposer"
  | "tokenAmount";

export type UiTokenAmountType = {
  token: string | UiTokenAmountInfo
}

export type UiTokenAmountInfo = {
  inputId: string;
}

export type App = {
  id: string;
  name: string;
  network: NETWORK;
  logoUri: string;
  ui: string;
  definition: string;
}

export type AppConfig = {
  ui: UiInstruction[];
  definition: any;
}

export type UiInstruction = {
  id: string;
  name: string;
  label: string;
  help: string;
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
  dataValue: string;
}

export type Arg = {
  index: number;
  name: string;
  dataType: any;
  dataValue: any;
}

export type DataElement = Account | Arg;

export class AppsProvider {

  network?: NETWORK;

  constructor(network?: NETWORK) {
    this.network = network;
  }

  getApps = async (): Promise<App[]> => {
    try {
      const getApps = (network?: NETWORK) => {
        if (!network) { return data.apps; }
        return data.apps.filter((a: any) => a.network == network);
      };
      let apps: App[] = [];
      const appList = getApps(this.network);
      for (let item of appList) {
        apps.push({
          id: item.id,
          name: item.name,
          network: item.network,
          logoUri: item.logo,
          ui: item.ui,
          definition: item.definition
        } as App);
      }
      return apps;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  };

  getAppConfig = async (
    appId: string,
    uiUrl: string, 
    definitionUrl: string
  ): Promise<AppConfig | null> => {
    try {
      if (!uiUrl || !definitionUrl) { return null; }
      const responses = await Promise.all([
        fetch(uiUrl),
        fetch(definitionUrl)
      ]);
      const uiResult = await responses[0].json();
      const defResult = await responses[1].json();
      return {
        ui: await getUiConfig(appId, uiResult, defResult),
        definition: defResult
      } as AppConfig;
    } catch (err: any) {
      console.log(err);
      return null;
    }
  };
}

const getUiConfig = async (appId: string, uiIxs: any, defData: any): Promise<UiInstruction[]> => {
  try {
    let uiConfigs: UiInstruction[] = [];
    for (let uiIx of uiIxs) {
      const ixId = (await PublicKey.findProgramAddress(
        [Buffer.from(uiIx.name)],
        new PublicKey(appId)
      ))[0].toBase58();
      let ix = {
        id: ixId,
        name: uiIx.name,
        label: uiIx.label,
        help: uiIx.help,
        uiElements: []     
      } as UiInstruction;
      // accounts
      let dataIx = defData.instructions.filter((i: any) => i.name === uiIx.name)[0];
      if (!dataIx) { continue; }
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
              isSigner: dataElem.isSigner,
              dataValue: ''
            } as Account
          } as UiElement);
          accIndex ++;
        }
      }
      // args
      let argIndex = 0
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
              index: argIndex,
              name: dataElem.name,
              dataType: dataElem.type,
              dataValue: ''
            } as Arg
          } as UiElement);
          argIndex ++;
        }
      }
      uiConfigs.push(ix);
    }
    return uiConfigs;
  } catch (err: any) {
    console.error(err);
    return [];
  }
};