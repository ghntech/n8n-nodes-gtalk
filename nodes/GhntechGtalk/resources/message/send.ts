import type { INodeProperties } from 'n8n-workflow';

export const messageSendDescription: INodeProperties[] = [
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'The ID of the channel to send the message to',
		required: true,
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
	},
	{
		displayName: 'Content Text',
		name: 'contentText',
		type: 'string',
		default: '',
		description: 'The text content of the message',
		required: true,
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
	}
];
