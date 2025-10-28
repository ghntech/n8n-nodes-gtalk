import type { INodeProperties } from 'n8n-workflow';
import { messageSendDescription } from './send';
import { messageSendTemplateDescription } from './sendTemplate';

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
			{
				name: 'Send Template',
				value: 'sendTemplate',
				action: 'Send a template message',
				description: 'Send a template message to a channel',
				routing: {
					request: {
						method: 'POST',
						url: '/api/gtalk/send-message',
					},
					send: {
						preSend: [
							async function (this, requestOptions) {
								const channelId = this.getNodeParameter('channelId', 0) as string;
								const templateId = this.getNodeParameter('templateId', 0) as string;
								const shortMessage = this.getNodeParameter('shortMessage', 0) as string;
								const templateData = this.getNodeParameter('templateData', 0, {}) as {
									icon_url?: string;
									title?: string;
									content?: string;
									actions?: { action: Array<{ text: string; style: string; type: string; url: string }> };
								};

								// Build the template data object with all keys (empty values if not provided)
								const dataObject: {
									icon_url: string;
									title: string;
									content: string;
									actions: Array<{ text: string; style: string; type: string; url: string }>;
								} = {
									icon_url: templateData.icon_url || '',
									title: templateData.title || '',
									content: templateData.content || '',
									actions: templateData.actions?.action || [],
								};

								// Build the template object
								const template: {
									templateId: string;
									shortMessage: string;
									data: string;
								} = {
									templateId,
									shortMessage,
									data: JSON.stringify(dataObject),
								};

								// Build the request body
								requestOptions.body = {
									channelId,
									clientMsgId: Date.now().toString(),
									content: {
										template,
									},
								};

								return requestOptions;
							},
						],
					},
				},
			},
		],
		default: 'send',
	},
	...messageSendDescription,
	...messageSendTemplateDescription,
];
