import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Account, App, AppConfig, Arg, NETWORK, UiElement, UiInstruction } from "./types";
import { fetch } from "cross-fetch";
import data from './apps.json';

const NATIVE_LOADER = new PublicKey("NativeLoader1111111111111111111111111111111");
const BASE_APPS_URL = "https://raw.githubusercontent.com/mean-dao/mean-multisig-apps/{env}/src/apps";

export class AppsProvider {

  network?: NETWORK;

  constructor(network?: NETWORK) {
    this.network = network ? network : NETWORK.MainnetBeta;
  }

  getApps = async (): Promise<App[]> => {
    try {
      const baseUrl = this.getBaseUrl();
      const getApps = (network?: NETWORK) => {
        if (!network) { return data.apps; }
        return data.apps.filter((a: any) => a.network == network);
      };
      let apps: App[] = [
        this.getCustomApp(this.network || 103)
      ];
      const appList = getApps(this.network);
      for (let item of appList) {
        apps.push({
          id: item.id,
          name: item.name,
          network: item.network,
          folder: item.folder,
          active: item.active,
          logoUri: `${baseUrl}/${item.folder}/logo.svg`,
          uiUrl: `${baseUrl}/${item.folder}/ui.json`,
          defUrl: `${baseUrl}/${item.folder}/definition.json`
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
      if (appId === NATIVE_LOADER.toBase58()) {
        const uiResponse = await fetch(uiUrl);
        const uiResult = (!uiResponse.ok || uiResponse.status !== 200) ? {} : await uiResponse.json();
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
      const uiResult = responses[0].status !== 200 ? null : await responses[0].json();
      const defResult = responses[1].status !== 200 ? null : await responses[1].json();
      return {
        ui: await getUiConfig(appId, uiResult, defResult),
        definition: defResult
      } as AppConfig;
    } catch (err: any) {
      console.log(err);
      return null;
    }
  };

  getBaseUrl = () => {
    const env = this.network === NETWORK.MainnetBeta ? "main" : "develop";
    return BASE_APPS_URL.replace("{env}", env);
  }
  
  private getCustomApp = (network: NETWORK): App => {
    const baseUrl = this.getBaseUrl();
    return {
      id: NATIVE_LOADER.toBase58(),
      name: "Custom Transaction",
      network: network,
      folder: "custom",
      active: true,
      logoUri: `${baseUrl}/custom/logo.svg`,
      uiUrl: `${baseUrl}/custom/ui.json`,
      defUrl: ""
    } as App;
  }
}

const getUiConfig = async (appId: string, uiIxs: any, defData: any): Promise<UiInstruction[]> => {
  try {
    let uiConfigs: UiInstruction[] = [];
    if (!uiIxs) { return uiConfigs; }
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
      if (appId === NATIVE_LOADER.toBase58()) {
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
        let dataIx = !defData ? null : defData.instructions.filter((i: any) => i.name === uiIx.name)[0];
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