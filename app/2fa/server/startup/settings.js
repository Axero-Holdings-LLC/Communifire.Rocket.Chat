import { settings } from '../../../settings';

settings.addGroup('Accounts', function() {
	this.section('Two Factor Authentication', function() {
		const enable2FA = {
			_id: 'Accounts_TwoFactorAuthentication_Enabled',
			value: false,
		};

		this.add('Accounts_TwoFactorAuthentication_Enabled', false, {
			type: 'boolean',
			public: true,
		});
		this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
			type: 'int',
			enableQuery: enable2FA,
		});

		this.add('Accounts_TwoFactorAuthentication_By_TOTP_Enabled', false, {
			type: 'boolean',
			enableQuery: enable2FA,
			public: true,
		});

		this.add('Accounts_TwoFactorAuthentication_By_Email_Enabled', false, {
			type: 'boolean',
			enableQuery: enable2FA,
			public: true,
		});
		this.add('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In', false, {
			type: 'boolean',
			enableQuery: [
				enable2FA,
				{
					_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
					value: true,
				},
			],
			wizard: {
				step: 3,
				order: 3,
			},
		});
		this.add('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration', 3600, {
			type: 'int',
			enableQuery: [
				enable2FA,
				{
					_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
					value: true,
				},
			],
		});

		this.add('Accounts_TwoFactorAuthentication_RememberFor', 1800, {
			type: 'int',
			enableQuery: enable2FA,
		});

		// TODO: Remove this setting for version 4.0
		this.add('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback', true, {
			type: 'boolean',
			enableQuery: enable2FA,
			public: true,
		});
	});
});
