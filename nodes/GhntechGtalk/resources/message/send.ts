import type { INodeProperties } from 'n8n-workflow';

export const messageSendDescription: INodeProperties[] = [
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'The ID of the channel to send the message to',
		required: true,
	},
	{
		displayName: 'Content Text',
		name: 'contentText',
		type: 'string',
		default: '',
		description: 'The text content of the message',
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		description: 'Additional fields to send with the message',
		options: [
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'options',
				options: [
					{
						name: 'Text',
						value: 'text',
					},
				],
				default: 'text',
				description: 'The type of content being sent',
			},
		],
	},
];
