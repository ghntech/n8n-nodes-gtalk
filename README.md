# GHN GTalk n8n Node

This is a community node for n8n to interact with the GHN GTalk API. It allows you to automate tasks related to GTalk, such as sending messages.

## Features

This node supports the following resources and operations:

### Message
*   **Send**: Send a text message to a channel
*   **Send Template**: Send a template message with structured content (icons, titles, actions)
*   **Send Photo**: Send a photo message (supports URL, File ID, or binary data)
*   **Send Video**: Send a video message (supports URL, File ID, or binary data)
*   **Send File**: Send a file message (supports URL, File ID, or binary data)

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
3.  Search for `GHN GTalk API` and select it.
4.  Provide the **Username** and **Password** for basic authentication. The `OA Token` will be automatically generated from these credentials.

## Usage Examples

### Send a Text Message

To send a simple text message:

1.  Add the **GHN GTalk** node to your workflow.
2.  Select **Message** as the **Resource**.
3.  Select **Send** as the **Operation**.
4.  Provide the **Channel ID** and **Content Text**.
5.  Execute the node to send the message.

### Send a Template Message

To send a template message with structured content:

1.  Add the **GHN GTalk** node to your workflow.
2.  Select **Message** as the **Resource**.
3.  Select **Send Template** as the **Operation**.
4.  Provide:
    *   **Channel ID**: The target channel
    *   **Template ID**: Your template identifier
    *   **Short Message**: A brief message summary
    *   **Template Data**: Structured data including:
        *   `icon_url`: URL to an icon image
        *   `title`: Template title
        *   `content`: Main content text
        *   `actions`: Array of action buttons with text, style, type, and URL
5.  Execute the node to send the template message.

### Send a Photo

To send a photo message:

1.  Add the **GHN GTalk** node to your workflow.
2.  Select **Message** as the **Resource**.
3.  Select **Send Photo** as the **Operation**.
4.  Choose your **Photo Source**:
    *   **URL or File ID**: Provide a direct image URL or a numeric File ID from a previous upload
    *   **Binary Field**: Select a binary property from previous workflow steps
5.  Optionally add a **Caption** for the photo.
6.  Execute the node to send the photo.

**Note**: Photos are automatically processed to generate thumbnails. Maximum file size is 100MB.

### Send a Video

To send a video message:

1.  Add the **GHN GTalk** node to your workflow.
2.  Select **Message** as the **Resource**.
3.  Select **Send Video** as the **Operation**.
4.  Choose your **Video Source**:
    *   **URL or File ID**: Provide a direct video URL or a numeric File ID from a previous upload
    *   **Binary Field**: Select a binary property from previous workflow steps
5.  Optionally add a **Caption** for the video.
6.  Execute the node to send the video.

**Note**: Videos are automatically processed to extract metadata (width, height, duration) and generate thumbnails. Maximum file size is 100MB. Requires `ffmpeg` and `ffprobe` to be installed on your system.

### Send a File

To send a file message:

1.  Add the **GHN GTalk** node to your workflow.
2.  Select **Message** as the **Resource**.
3.  Select **Send File** as the **Operation**.
4.  Choose your **File Source**:
    *   **URL or File ID**: Provide a direct file URL or a numeric File ID from a previous upload
    *   **Binary Field**: Select a binary property from previous workflow steps
5.  Execute the node to send the file.

**Note**: File types are automatically detected. Maximum file size is 100MB.

## Technical Notes

*   **File Size Limit**: All file uploads (photos, videos, files) have a maximum size of 100MB.
*   **File ID Reuse**: If you have a File ID from a previous upload, you can reuse it without re-uploading the file.
*   **Binary Data Support**: All media operations support binary data from previous workflow steps, making it easy to chain operations.
*   **Automatic Processing**: 
    *   Photos: Thumbnails are automatically generated (600x600px, fit inside)
    *   Videos: Metadata (dimensions, duration) is extracted and thumbnails are generated
    *   Files: MIME types are automatically detected
*   **Video Requirements**: Sending videos requires `ffmpeg` and `ffprobe` to be installed on your system for metadata extraction and thumbnail generation.

## Development

If you are developing this node, here are some useful commands:

*   `n8n-node build`: Compiles the TypeScript code to JavaScript.
*   `n8n-node build:watch`: Compiles the TypeScript code and watches for changes.
*   `n8n-node dev`: Starts n8n in development mode with the node loaded.
*   `n8n-node lint`: Lints the code.
*   `n8n-node lint:fix`: Lints the code and fixes fixable issues.
*   `n8n-node release`: Prepares a new release of the node.
*   `n8n-node prepublishOnly`: Runs before publishing the package.
