import type { INodeProperties } from 'n8n-workflow';
import { messageSendDescription } from './send';
import { messageSendTemplateDescription } from './sendTemplate';
import { messageSendPhotoDescription } from './sendPhoto';

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
			{
				name: 'Send Photo',
				value: 'sendPhoto',
				action: 'Send a photo message',
				description: 'Send a photo message to a channel',
				routing: {
					request: {
						method: 'POST',
						url: '/api/gtalk/send-message',
					},
					send: {
						preSend: [
							async function (this, requestOptions) {
								const sharp = (await import('sharp')).default;
								
								const channelId = this.getNodeParameter('channelId', 0) as string;
								const photoSource = this.getNodeParameter('photoSource', 0) as string;
								const caption = this.getNodeParameter('caption', 0) as string || '';
								const credentials = await this.getCredentials('ghntechGtalkApi');
								const baseURL = requestOptions.baseURL || 'https://mbff.ghn.vn';
								const oaToken = `${credentials.username}:${credentials.password}`;
								
								const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
								let fileId: string;
								let width: number;
								let height: number;

								// Check if input is File ID
								if (photoSource === 'urlOrFileId') {
									const photo = this.getNodeParameter('photo', 0) as string;
									
									// Check if it's a File ID (numeric only)
									if (/^\d+$/.test(photo)) {
										// Use File ID directly, but we still need dimensions
										// For File ID, we'll use default dimensions or skip dimension extraction
										fileId = photo;
										width = 0;
										height = 0;
									} else if (photo.startsWith('http://') || photo.startsWith('https://')) {
										// Download from URL - use httpRequestWithAuthentication to get buffer
										const response = await this.helpers.httpRequest({
											method: 'GET',
											url: photo,
											encoding: 'arraybuffer',
											returnFullResponse: false,
										});
										
										const imageBuffer = response as any;
										
										if (imageBuffer.length > MAX_FILE_SIZE) {
											throw new Error(`File size exceeds 100MB limit (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
										}
										
										// Extract metadata
										const metadata = await sharp(imageBuffer).metadata();
										width = metadata.width || 0;
										height = metadata.height || 0;
										const mimeType = metadata.format ? `image/${metadata.format}` : 'image/jpeg';
										const fileName = photo.split('/').pop()?.split('?')[0] || 'image.jpg';
										
										// Upload process
										fileId = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/initiate-upload`,
											body: {
												ChannelId: channelId,
												FileName: fileName,
												FileSize: imageBuffer.length.toString(),
												MimeType: mimeType,
												oaToken,
											},
											json: true,
										}).then(async (initResponse: any) => {
											const { PresignedURL, PresignedThumbURL, UploadId } = initResponse.data;
											
											// Upload original image
											await this.helpers.httpRequest({
												method: 'PUT',
												url: PresignedURL,
												body: imageBuffer,
												headers: {
													'Content-Type': mimeType,
												},
											});
											
											// Generate and upload thumbnail
											const thumbnail = await sharp(imageBuffer)
												.resize(600, 600, { fit: 'inside', withoutEnlargement: true })
												.toBuffer();
											
											await this.helpers.httpRequest({
												method: 'PUT',
												url: PresignedThumbURL,
												body: thumbnail,
												headers: {
													'Content-Type': mimeType,
												},
											});
											
											// Complete upload
											const completeResponse = await this.helpers.httpRequest({
												method: 'POST',
												url: `${baseURL}/api/gtalk/complete-upload`,
												body: {
													oaToken,
													UploadId,
												},
												json: true,
											});
											
											return completeResponse.data.Id;
										});
									} else {
										throw new Error('Photo must be a valid URL or numeric File ID');
									}
								} else {
									// Binary Field
									const binaryProperty = this.getNodeParameter('binaryProperty', 0) as string;
									
									// Get input data and check for binary property
									const items = this.getInputData();
									if (!items || items.length === 0) {
										throw new Error('No input data available');
									}

									if (!items?.binary?.[binaryProperty]) {
										throw new Error(`Binary property "${binaryProperty}" not found. Available properties: ${items?.binary ? Object.keys(items.binary).join(', ') : 'none'}`);
									}
									
									const binaryData = items.binary[binaryProperty];
									const imageBuffer = await this.helpers.getBinaryDataBuffer(binaryProperty, 0);
									
									if (imageBuffer.length > MAX_FILE_SIZE) {
										throw new Error(`File size exceeds 100MB limit (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
									}
									
									// Extract metadata
									const metadata = await sharp(imageBuffer).metadata();
									width = metadata.width || 0;
									height = metadata.height || 0;
									const mimeType = binaryData.mimeType || 'image/jpeg';
									const fileName = binaryData.fileName || 'image.jpg';
									
									// Upload process
									fileId = await this.helpers.httpRequest({
										method: 'POST',
										url: `${baseURL}/api/gtalk/initiate-upload`,
										body: {
											ChannelId: channelId,
											FileName: fileName,
											FileSize: imageBuffer.length.toString(),
											MimeType: mimeType,
											oaToken,
										},
										json: true,
									}).then(async (initResponse: any) => {
										const { PresignedURL, PresignedThumbURL, UploadId } = initResponse.data;
										
										// Upload original image
										await this.helpers.httpRequest({
											method: 'PUT',
											url: PresignedURL,
											body: imageBuffer,
											headers: {
												'Content-Type': mimeType,
											},
										});
										
										// Generate and upload thumbnail
										const thumbnail = await sharp(imageBuffer)
											.resize(600, 600, { fit: 'inside', withoutEnlargement: true })
											.toBuffer();
										
										await this.helpers.httpRequest({
											method: 'PUT',
											url: PresignedThumbURL,
											body: thumbnail,
											headers: {
												'Content-Type': mimeType,
											},
										});
										
										// Complete upload
										const completeResponse = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/complete-upload`,
											body: {
												oaToken,
												UploadId,
											},
											json: true,
										});
										
										return completeResponse.data.Id;
									});
								}
								
								// Build the request body for sending photo message
								requestOptions.body = {
									channelId,
									clientMsgId: Date.now().toString(),
									content: {
										attachment: {
											caption,
											items: [
												{
													image: {
														fileId,
														width,
														height,
													},
												},
											],
										},
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
	...messageSendPhotoDescription,
];
