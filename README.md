# Mean Solar Safe (Multisig) Apps

The **Solar Safe Apps** is an NPM package that keeps track of all protocols in the **Solana** ecosystem that are integrated with the [Solar Safe](https://github.com/mean-dao/multisig) protocol and allows Web3 apps to query and get information about them.

The **Solar Safe Apps** repository is maintained by Mean DAO and it will also accept pull requests from anyone who wants to integrate their own `program/protocol` with the [Solar Safe](https://github.com/mean-dao/multisig). Once the PR is reviewed and merge by the core team the new integration will be available on the multisig section on [MeanFi Web App](https://app.meanfi.com/multisig) and can be use to make proposal for any multisig safe.

# Usage

@mean-dao/mean-multisig-apps

[![npm](https://img.shields.io/npm/v/@mean-dao/mean-multisig-apps)](https://www.npmjs.com/package/@mean-dao/mean-multisig-apps/v/latest) 
<!-- [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mean-dao/mean-multisig-apps/edit/main/README.md) -->
[![NPM Publish](https://github.com/supermean-org/supersafe-apps/actions/workflows/release.yml/badge.svg)](https://github.com/supermean-org/supersafe-apps/actions/workflows/release.yml)

## Installation

```bash
npm install @mean-dao/mean-multisig-apps
```

```bash
yarn add @mean-dao/mean-multisig-apps
```

## Examples

### Query registered apps

```typescript
const network = 101; // 101 = "mainnet-beta", 102 = "testnet", 103 = "devnet";
const provider = new AppsProvider(network);
provider
  .getApps()
  .then((apps: App[]) => {
    console.log('apps', apps);
  });
```

> The info for the registered apps includes: **id**, **name**, **network**, **folder**, **active**, **logoUrl**, **uiUrl**, **defUrl**.

### Get a specific app configuration

```typescript
const app = apps[0];
provider.getAppConfig(
  app.id,
  app.uiUrl,
  app.defUrl
)
.then((config: AppConfig) => {
  console.log('config', config);
});
```

> The info for the app configuration includes: **ui** (the UI instruction configuration info), **definition** (JSON Schema of the program IDL).

### UI Instruction configuration info

```typescript
{
  id: "AJwQXP6HuY1HTLRfzg4q6z5BWwf373GsBh79KtPJyRob",
  name: "customProposal",
  label: "Custom Transaction Proposal",
  help: "Custom Transaction Proposal helper text or UI title",
  type: "config",
  uiElements: [
    {
      name: "serializedTx",
      label: "Serialized Transaction",
      help: "The serialized transaction in base64 string format.",
      type: "inputTextArea",
      value: "",
      visibility: "show"
    }
  ]
}
```

> The UI Instruction configuration defines the way the program instruction is going ask for the user input and the way the instruction data is going to be shown to the user in a friendly way.

#
## Registering a protocol

To register or integrate a new `protocol/program` in the **Solar Safe Apps** repository you need to add a new entry with the general protocol information in the [apps.json](https://github.com/mean-dao/mean-multisig-apps/blob/main/src/apps.json) file. Once that general info is added then you can add the protocol folder with the required files that are needed for the integration.

### Adding a new protocol entry to apps.json file

To add a new protocol a new entry with the following JSON schema needs to be added into the [apps.json](https://github.com/mean-dao/mean-multisig-apps/blob/main/src/apps.json) file:

```json
{
  "id": "<program address in the specified network id>",
  "name": "program name (name to display in the UI)",
  "network": 101,
  "folder": "program-folder",
  "active": false
}
```

> When configuring the integration three entries for each protocol has to be added (one for each network id since the address of the program might be different on each Solana network). In future updates this won't be required, and if there is only one entry then it will be assumed that the program is deployed with the same address in all Solana networks. Be aware that the `folder` property of the JSON Schema has to match with the program folder name that is going to be added later, otherwise the integration won't work as expected.

### Adding protocol folder and configuration files

The folder of the `protocol/program` will contains the configuration files that are needed for the integration to work and display properly in the UI. Those files will depend of the program specifications but there are 3 required files that will be necesary to add into the folder. Those files are described bellow:

- **Logo**: The logo of the program will be called `logo.svg` and should be a valid SVG file that is going to identify the program by its logo.
- **Definition**: The IDL file of the `protocol/program` will be called `definition.json`. This is required for the `creation/execution` of the program instructions and the parsing the the instructions data as well.
- **UI Config**: The UI configuration file for all program instructions. This file is JSON Schema file that has to be named `ui.json` and is going to have an array of the configurations for each program instruction. The configuration for each instruction is going to be described in some properties including the **UI Elements** array which is going to have the configuration description for all the UI inputs that are required by the instructions. This is an example of a UI Config file:

  ```json
  [
    {
      "name": "transfer",
      "label": "Transfer",
      "help": "Transfer funds",
      "accounts": [
        {
          "name": "source",
          "label": "From",
          "help": "The source of the funds",
          "type": "inputText",
          "value": "",
          "visibility": "show"
        },
        {
          "name": "destination",
          "label": "To",
          "help": "The destination of the funds",
          "type": "inputText",
          "value": "",
          "visibility": "show"
        },
        {
          "name": "owner",
          "label": "Owner",
          "help": "The owner of the source account",
          "type": "inputText",
          "value": "",
          "visibility": "show"
        }
      ],
      "args": [
        {
          "name": "amount",
          "label": "Amount",
          "help": "The amount to transfer",
          "type": {
            "from": {
              "inputId": "source"
            }
          },
          "value": "",
          "visibility": "show"
        }
      ]
    }
  ]
  ```
  The **UI Elements** of the instruction are **accounts** and **args**. Sometimes the value of those inputs are a known *(fixed and readonly)* values that are not going to change *(i.e: a program accounts)* and sometimes are calculated values. Those are only two of the many possible types for a **UI Element**. The type that is configured for the element is the characteristic that is going to determine how the element is managed. The next code shows all possible types for each UI Element in a specific instruction:

  ```typescript
  type UiType =
      "textInfo"
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
  ```
  For a detailed reference of all available types check [here](https://github.com/mean-dao/mean-multisig-apps/blob/main/src/types.ts) file.
  > This library is in constant development and all these configuration types might changed in the future. For that reason we recomment to be updated with the latest       version and upgrade your protocol configuration in a new PR as needed.

  Another important characteristic of the **UI Element** is the `visibility`. This is going to define if the input is going to be rendered in the UI to get its value from the user interaction. If the `visibility` is set to `false` then the value of the **UI Element** will be of `type: "knownValue"` or it will be a calculated type. The example bellow has a detailed explanation of a specific **UI Element**:

  ```jsonc
  {
    "name": "amount", // has to match with the arg name for the instruction in the IDL file.
    "label": "Amount", // The label that is going to be shown in the UI
    "help": "The amount to transfer", // Another text that  can be use as a UI component title or placeholder
    "type": { // This type is `UiTokenAmountType` and describes how the amount will be calculated using the `inputId` to get the decimals value of the token 
      "from": {
        "inputId": "source"
      }
    },
    "value": "", // The value is empty since is going to be entered by the user
    "visibility": "show" // Indicates that the **UI Element** is going to be rendered in the UI to get the user input.
  }
  ```
  
  To understand better the possible configurations and see more examples please check the registered programs files under the [apps](https://github.com/mean-dao/mean-multisig-apps/tree/main/src/apps) folder in this repository.
  
### Create a pull request to add the protocol files

Once the protocol folder and configuration files are ready you can commit your changes and make a pull request to this repository. After the pull request is reviewed, approved and merged to main branch by the Mean DAO Core Team the registered protocol will be ready to be used in the multisig section on [MeanFi Web App](https://app.meanfi.com/multisig) and will be ready to create proposals using its instructions in any multisig safe.

## Modify/upgrate an existing integration

Anytime you need to upgrade an existing protocol integration because an upgrade in your program, you can create a new pull request with the modifications and wait for the same proccess of review, approval and merging of the pull request before your new configuration is available and ready to be used.

## Cantact us

For more information of how the integration works please reach out to us:

- [Twitter](https://twitter.com/meanfinance)
- [Discord](https://discord.gg/qBKDgm49js)
- [Telegram](https://t.me/Meanprotocol)
