import type { INodeProperties } from 'n8n-workflow';

export const messageSendTemplateDescription: INodeProperties[] = [
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		description: 'The ID of the channel to send the template message to',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Template ID',
		name: 'templateId',
		type: 'string',
		default: '',
		description: 'The ID of the template to use',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Short Message',
		name: 'shortMessage',
		type: 'string',
		default: '',
		description: 'A short summary of the template message',
		required: true,
		displayOptions: {
			show: {
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Template Data',
		name: 'templateData',
		type: 'collection',
		default: {},
		description: 'Optional template data fields',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				operation: ['sendTemplate'],
			},
		},
		options: [
			{
				displayName: 'Icon URL',
				name: 'icon_url',
				type: 'string',
				default: '',
				description: 'URL of the icon to display in the template',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the template message',
			},
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Main content of the template message. Supports HTML tags like &lt;br/&gt;',
			},
			{
				displayName: 'Actions',
				name: 'actions',
				type: 'fixedCollection',
				default: {},
				description: 'Action buttons to display in the template',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'action',
						displayName: 'Action',
						values: [
							{
								displayName: 'Text',
								name: 'text',
								type: 'string',
								default: '',
								description: 'Button text',
								required: true,
							},
							{
								displayName: 'Style',
								name: 'style',
								type: 'options',
								options: [
									{
										name: 'Primary',
										value: 'primary',
									},
									{
										name: 'Secondary',
										value: 'secondary',
									},
								],
								default: 'primary',
								description: 'Button style',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Deeplink',
										value: 'deeplink',
									},
									{
										name: 'Browser Internal',
										value: 'browser_internal',
									},
									{
										name: 'Browser External',
										value: 'browser_external',
									},
								],
								default: 'browser_external',
								description: 'Action type',
							},
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								default: '',
								description: 'Action URL',
								required: true,
							},
						],
					},
				],
			},
		],
	},
];
