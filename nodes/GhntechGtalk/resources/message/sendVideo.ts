import type { INodeProperties } from 'n8n-workflow';

export const messageSendVideoDescription: INodeProperties[] = [
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'The ID of the channel to send the video message to',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendVideo'],
			},
		},
	},
	{
		displayName: 'Video Source',
		name: 'videoSource',
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
		description: 'The source of the video to send',
		displayOptions: {
			show: {
				operation: ['sendVideo'],
			},
		},
	},
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		default: 'data',
		description: 'Name of the binary property containing the video file',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendVideo'],
				videoSource: ['binaryField'],
			},
		},
	},
	{
		displayName: 'Video',
		name: 'video',
		type: 'string',
		default: '',
		description: 'URL of the video or File ID (numeric)',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendVideo'],
				videoSource: ['urlOrFileId'],
			},
		},
	},
	{
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		default: '',
		description: 'Optional caption for the video',
		displayOptions: {
			show: {
				operation: ['sendVideo'],
			},
		},
	},
];
