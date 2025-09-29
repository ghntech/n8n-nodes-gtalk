import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { messageDescription } from './resources/message';

export class GhntechGtalk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ghntech Gtalk',
		name: 'ghntechGtalk',
		icon: { light: 'file:ghntechGtalk.svg', dark: 'file:ghntechGtalk.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Ghntech Gtalk API',
		defaults: {
			name: 'Ghntech Gtalk',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'ghntechGtalkApi', required: true }],
		requestDefaults: {
			baseURL: 'https://test-api.mbff.ghn.tech',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
			},
			...messageDescription,
		],
	};
}
