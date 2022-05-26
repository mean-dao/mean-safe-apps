import { PublicKey } from "@solana/web3.js";
import { fetch } from "cross-fetch";
import data from './apps.json';

export const MEAN_MULTISIG_PROGRAM = new PublicKey("FF7U7Vj1PpBkTPau7frwLLrUHrjkxTQLsH7U5K3T3B3j");
export const BASE_APPS_URL = "https://raw.githubusercontent.com/mean-dao/mean-multisig-apps/develop/src/apps";

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
  | "multisig"
  | UiTokenAmountType
  | UiFunc;

export type UiTokenAmountType = {
  token: string | UiTokenAmountInfo
}

export type UiTokenAmountInfo = {
  inputId: string;
}

export type UiFunc = {
  func: string;
}

export type UiFuncInfo = {
  name: string;
  inputs: UiFuncInput[]
}

export type UiFuncInput = UiElement | {
  name: string;
  value: any;
}

export type App = {
  id: string;
  name: string;
  network: NETWORK;
  folder: string;
  logoUri: string;
  uiUrl: string;
  defUrl: string;
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
  type: UiInstructionType;
  uiElements: UiElement[];
}

export type UiInstructionType = "config" | {
  func: UiInstructionTypeFunc;
}

export type UiInstructionTypeFunc = {
  name: string;
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
      let apps: App[] = [
        getCustomAppConfig(this.network || 103)
      ];
      const appList = getApps(this.network);
      for (let item of appList) {
        if (!item.folder) { continue; }
        apps.push({
          id: item.id,
          name: item.name,
          network: item.network,
          folder: item.folder,
          logoUri: `${BASE_APPS_URL}/${item.folder}/logo.svg`,
          uiUrl: `${BASE_APPS_URL}/${item.folder}/ui.json`,
          defUrl: `${BASE_APPS_URL}/${item.folder}/definition.json`
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
    defUrl: string
  ): Promise<AppConfig | null> => {
    try {
      if (appId === MEAN_MULTISIG_PROGRAM.toBase58()) {
        const uiResponse = await fetch(uiUrl);
        const uiResult = await uiResponse.json();
        return {
          ui: await getUiConfig(appId, uiResult, undefined),
          definition: ""
        } as AppConfig;
      }
      if (!uiUrl || !defUrl) { return null; }
      const responses = await Promise.all([
        fetch(uiUrl),
        fetch(defUrl)
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

const getCustomAppConfig = (network: NETWORK): App => {
  return {
    id: MEAN_MULTISIG_PROGRAM.toBase58(),
    name: "Custom Transaction",
    network: network,
    folder: "custom",
    logoUri: `${BASE_APPS_URL}/custom/logo.svg`,
    uiUrl: `${BASE_APPS_URL}/custom/ui.json`,
    defUrl: ""
  } as App;
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
        type: uiIx.type,
        uiElements: []     
      } as UiInstruction;
      // custom proposal
      if (appId === MEAN_MULTISIG_PROGRAM.toBase58()) {
        const uiArg = uiIxs[0].args[0];
        if (!uiArg) { continue; }
        ix.uiElements.push({
          name: uiArg.name,
          label: uiArg.label,
          help: uiArg.help,
          type: uiArg.type,
          value: uiArg.value,
          visibility: uiArg.visibility,
          dataElement: undefined
        } as UiElement);
      } else {
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
      }
      uiConfigs.push(ix);
    }
    return uiConfigs;
  } catch (err: any) {
    console.error(err);
    return [];
  }
};