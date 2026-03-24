import type { INodeProperties } from 'n8n-workflow';

export const messageSendPhotoDescription: INodeProperties[] = [
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'The ID of the channel to send the photo message to',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendPhoto'],
			},
		},
	},
	{
		displayName: 'Photo Source',
		name: 'photoSource',
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
		description: 'The source of the photo to send',
		displayOptions: {
			show: {
				operation: ['sendPhoto'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		default: 'data',
		description: 'Name of the binary property containing the image file',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendPhoto'],
				photoSource: ['binaryField'],
			},
		},
	},
	{
		displayName: 'Photo',
		name: 'photo',
		type: 'string',
		default: '',
		description: 'URL of the image or File ID (numeric)',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendPhoto'],
				photoSource: ['urlOrFileId'],
			},
		},
	},
	{
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		default: '',
		description: 'Optional caption for the photo',
		displayOptions: {
			show: {
				operation: ['sendPhoto'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['sendPhoto'],
			},
		},
		options: [
			{
				displayName: 'Parse Mode',
				name: 'parseMode',
				type: 'options',
				options: [
					{
						name: 'Plain Text',
						value: 'PLAIN_TEXT',
					},
					{
						name: 'Markdown',
						value: 'MARKDOWN',
					},
					{
						name: 'HTML',
						value: 'HTML',
					},
				],
				default: 'PLAIN_TEXT',
				description: 'How to parse the message content',
			},
		],
	},
];
