import type { INodeProperties } from 'n8n-workflow';
import { messageSendDescription } from './send';

const showOnlyForMessages = {
	resource: ['message'],
};

export const messageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForMessages,
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send a message',
				description: 'Send a message to a channel',
				routing: {
					request: {
						method: 'POST',
						url: '/api/gtalk/send-message',
						body: {
							channelId: '={{$parameter.channelId}}',
							clientMsgId: '={{Date.now()}}',
							content: {
								text: '={{$parameter.contentText}}',
							},
						},
					},
				},
			},
		],
		default: 'send',
	},
	...messageSendDescription,
];
