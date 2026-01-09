import type { INodeProperties } from 'n8n-workflow';

export const messageSendFileDescription: INodeProperties[] = [
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'The ID of the channel to send the file message to',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendFile'],
			},
		},
	},
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		options: [
			{
				name: 'Binary Field',
				value: 'binaryField',
				description: 'Use a binary field from the input data',
			},
			{
				name: 'URL or File ID',
				value: 'urlOrFileId',
				description: 'Provide a URL or existing File ID',
			},
		],
		default: 'binaryField',
		description: 'The source of the file to send',
		displayOptions: {
			show: {
				operation: ['sendFile'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		default: 'data',
		description: 'Name of the binary property containing the file',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendFile'],
				fileSource: ['binaryField'],
			},
		},
	},
	{
		displayName: 'File',
		name: 'file',
		type: 'string',
		default: '',
		description: 'URL of the file or File ID (numeric)',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendFile'],
				fileSource: ['urlOrFileId'],
			},
		},
	},
];
