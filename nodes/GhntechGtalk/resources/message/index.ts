import type { INodeProperties } from 'n8n-workflow';
import { messageSendDescription } from './send';
import { messageSendTemplateDescription } from './sendTemplate';
import { messageSendPhotoDescription } from './sendPhoto';
import { messageSendVideoDescription } from './sendVideo';
import { messageSendFileDescription } from './sendFile';

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
										// Use File ID directly, but we need to fetch dimensions from Detail File API
										fileId = photo;
										
										// Fetch file details to get dimensions
										const detailResponse = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/detail-file`,
											body: {
												oaToken,
												Id: fileId,
											},
											json: true,
										});
										
										// Check for errors in the response
										if (detailResponse.errorCode !== 'success') {
											const errorMsg = detailResponse.error?.errorMessage || 'Unknown error';
											throw new Error(`Failed to retrieve file details for File ID ${fileId}: ${errorMsg}`);
										}
										
										// Parse metadata to get dimensions
										if (detailResponse.data?.Metadata) {
											const metadata = JSON.parse(detailResponse.data.Metadata);
											width = metadata.width || 0;
											height = metadata.height || 0;
										} else {
											width = 0;
											height = 0;
										}
									} else if (photo.startsWith('http://') || photo.startsWith('https://')) {
										// Download from URL - use httpRequestWithAuthentication to get buffer
										const response = await this.helpers.httpRequest({
											method: 'GET',
											url: photo,
											encoding: 'arraybuffer',
											returnFullResponse: false,
										});
										
										const imageBuffer = response as Buffer;
										
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
												Metadata: JSON.stringify({ width, height }),
												oaToken,
											},
											json: true,
										}).then(async (initResponse: { data: { PresignedURL: string; PresignedThumbURL: string; UploadId: string } }) => {
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
											Metadata: JSON.stringify({ width, height }),
											oaToken,
										},
										json: true,
									}).then(async (initResponse: { data: { PresignedURL: string; PresignedThumbURL: string; UploadId: string; Id: string } }) => {
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
			{
				name: 'Send File',
				value: 'sendFile',
				action: 'Send a file message',
				description: 'Send a file message to a channel',
				routing: {
					request: {
						method: 'POST',
						url: '/api/gtalk/send-message',
					},
					send: {
						preSend: [
							async function (this, requestOptions) {
								const channelId = this.getNodeParameter('channelId', 0) as string;
								const fileSource = this.getNodeParameter('fileSource', 0) as string;
								const credentials = await this.getCredentials('ghntechGtalkApi');
								const baseURL = requestOptions.baseURL || 'https://mbff.ghn.vn';
								const oaToken = `${credentials.username}:${credentials.password}`;
								
								const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
								let fileId: string;
								let fileName: string;
								let mimeType: string;
								let fileSize: number;

								// Check if input is File ID
								if (fileSource === 'urlOrFileId') {
									const file = this.getNodeParameter('file', 0) as string;
									
									// Check if it's a File ID (numeric only)
									if (/^\d+$/.test(file)) {
										// Use File ID directly, but we need to fetch file details from Detail File API
										fileId = file;
										
										// Fetch file details to get file information
										const detailResponse = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/detail-file`,
											body: {
												oaToken,
												Id: fileId,
											},
											json: true,
										});
										
										// Check for errors in the response
										if (detailResponse.errorCode !== 'success') {
											const errorMsg = detailResponse.error?.errorMessage || 'Unknown error';
											throw new Error(`Failed to retrieve file details for File ID ${fileId}: ${errorMsg}`);
										}
										
										// Extract file information from the response
										fileName = detailResponse.data?.FileName || '';
										mimeType = detailResponse.data?.MimeType || '';
										fileSize = parseInt(detailResponse.data?.FileSize || '0', 10);
									} else if (file.startsWith('http://') || file.startsWith('https://')) {
										// Download from URL
										const response = await this.helpers.httpRequest({
											method: 'GET',
											url: file,
											encoding: 'arraybuffer',
											returnFullResponse: false,
										});
										
										const fileBuffer = response as Buffer;
										
										if (fileBuffer.length > MAX_FILE_SIZE) {
											throw new Error(`File size exceeds 100MB limit (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
										}
										
										// Detect file type from buffer
										const fileType = await import('file-type');
										const detectedType = await fileType.fromBuffer(fileBuffer);
										
										// Extract filename from URL
										const baseFileName = file.split('/').pop()?.split('?')[0] || 'file';
										
										// Use detected MIME type or fallback
										mimeType = detectedType?.mime || 'application/octet-stream';
										
										// Improve filename with detected extension if needed
										if (detectedType?.ext && !baseFileName.includes('.')) {
											fileName = `${baseFileName}.${detectedType.ext}`;
										} else {
											fileName = baseFileName;
										}
										
										fileSize = fileBuffer.length;
										
										// Upload process
										fileId = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/initiate-upload`,
											body: {
												ChannelId: channelId,
												FileName: fileName,
												FileSize: fileSize.toString(),
												MimeType: mimeType,
												oaToken,
											},
											json: true,
										}).then(async (initResponse: { data: { PresignedURL: string; UploadId: string; Id: string } }) => {
											const { PresignedURL, UploadId } = initResponse.data;
											
											// Upload file
											await this.helpers.httpRequest({
												method: 'PUT',
												url: PresignedURL,
												body: fileBuffer,
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
										throw new Error('File must be a valid URL or numeric File ID');
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
									const fileBuffer = await this.helpers.getBinaryDataBuffer(binaryProperty, 0);
									
									if (fileBuffer.length > MAX_FILE_SIZE) {
										throw new Error(`File size exceeds 100MB limit (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
									}
									
									fileName = binaryData.fileName || 'file';
									mimeType = binaryData.mimeType || 'application/octet-stream';
									fileSize = fileBuffer.length;
									
									// Upload process
									fileId = await this.helpers.httpRequest({
										method: 'POST',
										url: `${baseURL}/api/gtalk/initiate-upload`,
										body: {
											ChannelId: channelId,
											FileName: fileName,
											FileSize: fileSize.toString(),
											MimeType: mimeType,
											oaToken,
										},
										json: true,
									}).then(async (initResponse: { data: { PresignedURL: string; UploadId: string; Id: string } }) => {
										const { PresignedURL, UploadId } = initResponse.data;
										
										// Upload file
										await this.helpers.httpRequest({
											method: 'PUT',
											url: PresignedURL,
											body: fileBuffer,
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
								
								// Build the request body for sending file message
								requestOptions.body = {
									channelId,
									clientMsgId: Date.now().toString(),
									content: {
										attachment: {
											items: [
												{
													file: {
														fileId,
														fileName,
														mimeType,
														fileSize,
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
			{
				name: 'Send Video',
				value: 'sendVideo',
				action: 'Send a video message',
				description: 'Send a video message to a channel',
				routing: {
					request: {
						method: 'POST',
						url: '/api/gtalk/send-message',
					},
					send: {
						preSend: [
							async function (this, requestOptions) {
								const sharp = (await import('sharp')).default;
								const ffmpegPath = require('ffmpeg-static');
								const ffprobePath = require('ffprobe-static').path;
								const { promisify } = await import('util');
								const { exec } = await import('child_process');
								const execAsync = promisify(exec);
								
								const channelId = this.getNodeParameter('channelId', 0) as string;
								const videoSource = this.getNodeParameter('videoSource', 0) as string;
								const caption = this.getNodeParameter('caption', 0) as string || '';
								const credentials = await this.getCredentials('ghntechGtalkApi');
								const baseURL = requestOptions.baseURL || 'https://mbff.ghn.vn';
								const oaToken = `${credentials.username}:${credentials.password}`;
								
								const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
								let fileId: string;
								let width: number;
								let height: number;
								let duration: number;

								// Check if input is File ID
								if (videoSource === 'urlOrFileId') {
									const video = this.getNodeParameter('video', 0) as string;
									
									// Check if it's a File ID (numeric only)
									if (/^\d+$/.test(video)) {
										// Use File ID directly, but we need to fetch dimensions and duration from Detail File API
										fileId = video;
										
										// Fetch file details to get dimensions and duration
										const detailResponse = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/detail-file`,
											body: {
												oaToken,
												Id: fileId,
											},
											json: true,
										});
										
										// Check for errors in the response
										if (detailResponse.errorCode !== 'success') {
											const errorMsg = detailResponse.error?.errorMessage || 'Unknown error';
											throw new Error(`Failed to retrieve file details for File ID ${fileId}: ${errorMsg}`);
										}
										
										// Parse metadata to get dimensions and duration
										if (detailResponse.data?.Metadata) {
											const metadata = JSON.parse(detailResponse.data.Metadata);
											width = metadata.width || 0;
											height = metadata.height || 0;
											duration = metadata.duration || 0;
										} else {
											width = 0;
											height = 0;
											duration = 0;
										}
									} else if (video.startsWith('http://') || video.startsWith('https://')) {
										// Download from URL
										const response = await this.helpers.httpRequest({
											method: 'GET',
											url: video,
											encoding: 'arraybuffer',
											returnFullResponse: false,
										});
										
										const videoBuffer = response as Buffer;
										
										if (videoBuffer.length > MAX_FILE_SIZE) {
											throw new Error(`File size exceeds 100MB limit (${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
										}
										
										// Extract metadata and thumbnail using ffmpeg
										const fsModule = await import('fs');
										const pathModule = await import('path');
										const osModule = await import('os');
										
										const { width: w, height: h, duration: d, thumbnail } = await new Promise<{
											width: number;
											height: number;
											duration: number;
											thumbnail: Buffer;
										}>((resolve, reject) => {
											// Create temp files
											const tempDir = osModule.tmpdir();
											const tempVideoPath = pathModule.join(tempDir, `video_${Date.now()}.mp4`);
											const tempThumbPath = pathModule.join(tempDir, `thumb_${Date.now()}.png`);
											
											// Write video buffer to temp file
											fsModule.writeFileSync(tempVideoPath, videoBuffer);
											
											// First, get video metadata using ffprobe
											const ffprobeCommand = `"${ffprobePath}" -v error -show_entries format=duration:stream=width,height,codec_type -of json "${tempVideoPath}"`;
											
											execAsync(ffprobeCommand)
												.then(({ stdout }) => {
													const metadata = JSON.parse(stdout);
													const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
													const w = videoStream?.width || 0;
													const h = videoStream?.height || 0;
													const d = Math.floor(parseFloat(metadata.format?.duration || '0'));
													
													// Extract thumbnail using ffmpeg
													const ffmpegCommand = `"${ffmpegPath}" -i "${tempVideoPath}" -ss 00:00:00.000 -vframes 1 "${tempThumbPath}"`;
													
													return execAsync(ffmpegCommand).then(() => {
														// Read thumbnail
														const thumbnail = fsModule.readFileSync(tempThumbPath);
														
														// Cleanup
														try { fsModule.unlinkSync(tempVideoPath); } catch {
															// Ignore cleanup errors
														}
														try { fsModule.unlinkSync(tempThumbPath); } catch {
															// Ignore cleanup errors
														}
														
														resolve({ width: w, height: h, duration: d, thumbnail });
													});
												})
												.catch((err: Error) => {
													// Cleanup
													try { fsModule.unlinkSync(tempVideoPath); } catch {
														// Ignore cleanup errors
													}
													try { fsModule.unlinkSync(tempThumbPath); } catch {
														// Ignore cleanup errors
													}
													reject(err);
												});
										});
										
										width = w;
										height = h;
										duration = d;
										const mimeType = 'video/mp4';
										const fileName = video.split('/').pop()?.split('?')[0] || 'video.mp4';
										
										// Upload process
										fileId = await this.helpers.httpRequest({
											method: 'POST',
											url: `${baseURL}/api/gtalk/initiate-upload`,
											body: {
												ChannelId: channelId,
												FileName: fileName,
												FileSize: videoBuffer.length.toString(),
												MimeType: mimeType,
												Metadata: JSON.stringify({ width, height, duration }),
												oaToken,
											},
											json: true,
										}).then(async (initResponse: { data: { PresignedURL: string; PresignedThumbURL: string; UploadId: string; Id: string } }) => {
											const { PresignedURL, PresignedThumbURL, UploadId } = initResponse.data;
											
											// Upload original video
											await this.helpers.httpRequest({
												method: 'PUT',
												url: PresignedURL,
												body: videoBuffer,
												headers: {
													'Content-Type': mimeType,
												},
											});
											
											// Resize and upload thumbnail as PNG
											const resizedThumbnail = await sharp(thumbnail)
												.resize(600, 600, { fit: 'inside', withoutEnlargement: true })
												.toBuffer();
											
											await this.helpers.httpRequest({
												method: 'PUT',
												url: PresignedThumbURL,
												body: resizedThumbnail,
												headers: {
													'Content-Type': 'image/png',
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
										throw new Error('Video must be a valid URL or numeric File ID');
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
									const videoBuffer = await this.helpers.getBinaryDataBuffer(binaryProperty, 0);
									
									if (videoBuffer.length > MAX_FILE_SIZE) {
										throw new Error(`File size exceeds 100MB limit (${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
									}
									
									// Extract metadata and thumbnail using ffmpeg
									const fsModule = await import('fs');
									const pathModule = await import('path');
									const osModule = await import('os');
									
									const { width: w, height: h, duration: d, thumbnail } = await new Promise<{
										width: number;
										height: number;
										duration: number;
										thumbnail: Buffer;
									}>((resolve, reject) => {
										// Create temp files
										const tempDir = osModule.tmpdir();
										const tempVideoPath = pathModule.join(tempDir, `video_${Date.now()}.mp4`);
										const tempThumbPath = pathModule.join(tempDir, `thumb_${Date.now()}.png`);
										
										// Write video buffer to temp file
										fsModule.writeFileSync(tempVideoPath, videoBuffer);
										
										// First, get video metadata using ffprobe
										const ffprobeCommand = `"${ffprobePath}" -v error -show_entries format=duration:stream=width,height,codec_type -of json "${tempVideoPath}"`;
										
										execAsync(ffprobeCommand)
											.then(({ stdout }) => {
												const metadata = JSON.parse(stdout);
												const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
												const w = videoStream?.width || 0;
												const h = videoStream?.height || 0;
												const d = Math.floor(parseFloat(metadata.format?.duration || '0'));
												
												// Extract thumbnail using ffmpeg
												const ffmpegCommand = `"${ffmpegPath}" -i "${tempVideoPath}" -ss 00:00:00.000 -vframes 1 "${tempThumbPath}"`;
												
												return execAsync(ffmpegCommand).then(() => {
													// Read thumbnail
													const thumbnail = fsModule.readFileSync(tempThumbPath);
													
													// Cleanup
													try { fsModule.unlinkSync(tempVideoPath); } catch {
														// Ignore cleanup errors
													}
													try { fsModule.unlinkSync(tempThumbPath); } catch {
														// Ignore cleanup errors
													}
													
													resolve({ width: w, height: h, duration: d, thumbnail });
												});
											})
											.catch((err: Error) => {
												// Cleanup
												try { fsModule.unlinkSync(tempVideoPath); } catch {
													// Ignore cleanup errors
												}
												try { fsModule.unlinkSync(tempThumbPath); } catch {
													// Ignore cleanup errors
												}
												reject(err);
											});
									});
									
									width = w;
									height = h;
									duration = d;
									const mimeType = binaryData.mimeType || 'video/mp4';
									const fileName = binaryData.fileName || 'video.mp4';
									
									// Upload process
									fileId = await this.helpers.httpRequest({
										method: 'POST',
										url: `${baseURL}/api/gtalk/initiate-upload`,
										body: {
											ChannelId: channelId,
											FileName: fileName,
											FileSize: videoBuffer.length.toString(),
											MimeType: mimeType,
											Metadata: JSON.stringify({ width, height, duration }),
											oaToken,
										},
										json: true,
									}).then(async (initResponse: { data: { PresignedURL: string; PresignedThumbURL: string; UploadId: string; Id: string } }) => {
										const { PresignedURL, PresignedThumbURL, UploadId } = initResponse.data;
										
										// Upload original video
										await this.helpers.httpRequest({
											method: 'PUT',
											url: PresignedURL,
											body: videoBuffer,
											headers: {
												'Content-Type': mimeType,
											},
										});
										
										// Resize and upload thumbnail as PNG
										const resizedThumbnail = await sharp(thumbnail)
											.resize(600, 600, { fit: 'inside', withoutEnlargement: true })
											.toBuffer();
										
										await this.helpers.httpRequest({
											method: 'PUT',
											url: PresignedThumbURL,
											body: resizedThumbnail,
											headers: {
												'Content-Type': 'image/png',
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
								
								// Build the request body for sending video message
								requestOptions.body = {
									channelId,
									clientMsgId: Date.now().toString(),
									content: {
										attachment: {
											caption,
											items: [
												{
													video: {
														fileId,
														width,
														height,
														duration,
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
	...messageSendFileDescription,
	...messageSendVideoDescription,
];
