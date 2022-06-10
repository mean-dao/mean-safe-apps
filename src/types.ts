export enum NETWORK {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

export type UiElementVisibility = "show" | "hide";

export type UiType =
  | "textInfo"
  | "yesOrNo"
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
  token: string | UiTokenAmountInfo;
};

export type UiTokenAmountInfo = {
  inputId: string;
};

export type UiFunc = {
  func: string;
};

export type UiFuncInfo = {
  name: string;
  inputs: UiFuncInput[];
};

export type UiFuncInput =
  | UiElement
  | {
      name: string;
      value: any;
    };

export type App = {
  id: string;
  name: string;
  network: NETWORK;
  folder: string;
  active: boolean;
  logoUri: string;
  uiUrl: string;
  defUrl: string;
};

export type AppConfig = {
  ui: UiInstruction[];
  definition: any;
};

export type UiInstruction = {
  id: string;
  name: string;
  label: string;
  help: string;
  type: UiInstructionType;
  uiElements: UiElement[];
};

export type UiInstructionType =
  | "config"
  | {
      func: UiInstructionTypeFunc;
    };

export type UiInstructionTypeFunc = {
  name: string;
};

export type UiElement = {
  name: string;
  label: string;
  help: string;
  type: UiType;
  value: any;
  visibility: UiElementVisibility;
  dataElement: DataElement | undefined;
};

export type Account = {
  index: number;
  name: string;
  isSigner: boolean;
  isWritable: boolean;
  dataValue: string;
};

export type Arg = {
  index: number;
  name: string;
  dataType: any;
  dataValue: any;
};

export type DataElement = Account | Arg;
