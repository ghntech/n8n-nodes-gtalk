# Ghntech Gtalk n8n Node

This is a community node for n8n to interact with the Ghntech Gtalk API. It allows you to automate tasks related to Gtalk, such as sending messages.

## Features

This node supports the following resources and operations:

### Message
*   **Send**: Send a message to a specified channel.

## Installation

To install this n8n community node, you can use the following command in your n8n root directory:

```bash
npm install @ghntech/n8n-nodes-gtalk
```

Alternatively, you can install it directly from within n8n:

1.  Go to **Settings** > **Community Nodes**.
2.  Click **Install a custom node**.
3.  Enter `@ghntech/n8n-nodes-gtalk` in the **npm package name** field.
4.  Click **Install**.

## Credentials

This node requires `GhntechGtalkApi` credentials. To set them up:

1.  In n8n, click on **Credentials** in the left sidebar.
2.  Click **New Credential**.
3.  Search for `Ghntech Gtalk Api` and select it.
4.  Provide the **Username** and **Password** for basic authentication. The `OA Token` will be automatically generated from these credentials.

## Usage Example: Send a Message

To send a message using this node:

1.  Add the **Ghntech Gtalk** node to your workflow.
2.  Select **Message** as the **Resource**.
3.  Select **Send** as the **Operation**.
4.  Provide the **Channel ID** and **Content Text**. The `Client Message ID` will be automatically generated using a timestamp.
5.  Execute the node to send the message.

## Development

If you are developing this node, here are some useful commands:

*   `npm run build`: Compiles the TypeScript code to JavaScript.
*   `npm run build:watch`: Compiles the TypeScript code and watches for changes.
*   `npm run dev`: Starts n8n in development mode with the node loaded.
*   `npm run lint`: Lints the code.
*   `npm run lint:fix`: Lints the code and fixes fixable issues.
*   `npm run release`: Prepares a new release of the node.
*   `npm run prepublishOnly`: Runs before publishing the package.
