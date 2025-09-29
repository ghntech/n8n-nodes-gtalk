import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GhntechGtalkApi implements ICredentialType {
	name = 'ghntechGtalkApi';

	displayName = 'Ghntech Gtalk API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/@ghntech/-gtalk?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			body: {
				oaToken: '={{$credentials.username}}:{{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://test-api.mbff.ghn.tech',
			url: '/v1/user',
		},
	};
}
