import { Meteor } from 'meteor/meteor';

import { settingsRegistry } from '../../settings/server';

Meteor.startup(() => {
	// name should be captialzded start with captial charachter and the rest small
	// name should be characters, numbers or underscore
	const name = 'Communifire';
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }`, false, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Enable', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-url`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'URL', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-token_path`, '/authentication/oauth/token', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Token_Path', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-token_sent_via`, 'payload', { type: 'select', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Token_Sent_Via', persistent: true, values: [{ key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-identity_token_sent_via`, 'header', { type: 'select', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Identity_Token_Sent_Via', persistent: true, values: [{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' }, { key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-identity_path`, '/authentication/oauth/profile', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Identity_Path', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-authorize_path`, '/authentication/oauth/authorize', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Authorize_Path', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-scope`, 'openid', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Scope', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-access_token_param`, 'access_token', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Access_Token_Param', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-id`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_id', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-secret`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Secret', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-login_style`, 'redirect', { type: 'select', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Login_Style', persistent: true, values: [{ key: 'redirect', i18nLabel: 'Redirect' }, { key: 'popup', i18nLabel: 'Popup' }, { key: '', i18nLabel: 'Default' }] });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-button_label_text`, '', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-button_label_color`, '#FFFFFF', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-button_color`, '#1d74f5', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-username_field`, 'username', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Username_Field', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-email_field`, 'email', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Email_Field', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-name_field`, 'name', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Name_Field', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-avatar_field`, 'avatar', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Avatar_Field', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-roles_claim`, 'roles', { type: 'string', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Roles_Claim', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-merge_roles`, true, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Merge_Roles', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-merge_users`, true, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Merge_Users', persistent: true });
	settingsRegistry.add(`Accounts_OAuth_Custom-${ name }-show_button`, true, { type: 'boolean', group: 'OAuth', section: `Custom OAuth: ${ name }`, i18nLabel: 'Accounts_OAuth_Custom_Show_Button_On_Login_Page', persistent: true });
});
