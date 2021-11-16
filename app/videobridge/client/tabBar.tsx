import React, { useMemo, lazy, ReactNode } from 'react';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Option, Badge, Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import toastr from 'toastr';

import { useSetModal } from '../../../client/contexts/ModalContext';
import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useUserRoom, useUser } from '../../../client/contexts/UserContext';
import Header from '../../../client/components/Header';

const templateBBB = lazy(() => import('../../../client/views/room/contextualBar/Call/BBB'));

addAction('bbb_video', ({ room }) => {
	const enabled = useSetting('bigbluebutton_Enabled');
	const t = useTranslation();

	const live = room && room.streamingOptions && room.streamingOptions.type === 'call';

	const enabledDirect = useSetting('bigbluebutton_enable_d');
	const enabledGroup = useSetting('bigbluebutton_enable_p');
	const enabledChannel = useSetting('bigbluebutton_enable_c');
	const enabledTeams = useSetting('bigbluebutton_enable_teams');

	const groups = useStableArray([
		enabledDirect && 'direct', 'direct_multiple',
		enabledGroup && 'group',
		enabledTeams && 'team',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);
	const user = useUser();
	const username = user ? user.username : '';
	const enableOption = enabled && (!username || !room.muted?.includes(username));

	return useMemo(() => (enableOption ? {
		groups,
		id: 'bbb_video',
		title: 'BBB_Video_Call',
		icon: 'phone',
		template: templateBBB,
		order: live ? -1 : 4,
		renderAction: (props): ReactNode => <Header.ToolBoxAction {...props}>
			{live ? <Header.Badge title={t('Started_a_video_call')} variant='primary'>!</Header.Badge> : null}
		</Header.ToolBoxAction>,
		renderOption: ({ label: { title, icon }, ...props }: any): ReactNode => <Option label={title} title={title} icon={icon} {...props}><Badge title={t('Started_a_video_call')} variant='primary'>!</Badge></Option>,
	} : null), [enableOption, groups, live, t]);
});

const templateJitsi = lazy(() => import('../../../client/views/room/contextualBar/Call/Jitsi'));

addAction('video', ({ room }) => {
	const enabled = useSetting('Jitsi_Enabled') && false; // <<<
	const t = useTranslation();

	const enabledChannel = useSetting('Jitsi_Enable_Channels');
	const enabledTeams = useSetting('Jitsi_Enable_Teams');

	const groups = useStableArray([
		'direct',
		'direct_multiple',
		'group',
		'live',
		enabledTeams && 'team',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);

	const currentTime = new Date().getTime();
	const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();
	const live = jitsiTimeout > currentTime || null;
	const user = useUser();
	const username = user ? user.username : '';
	const enableOption = enabled && (!username || !room.muted?.includes(username));

	return useMemo(() => (enableOption ? {
		groups,
		id: 'video',
		title: 'Call',
		icon: 'phone',
		template: templateJitsi,
		full: true,
		order: live ? -1 : 4,
		renderAction: (props): ReactNode => <Header.ToolBoxAction {...props}>
			{live && <Header.Badge title={t('Started_a_video_call')} variant='primary'>!</Header.Badge>}
		</Header.ToolBoxAction>,
		renderOption: ({ label: { title, icon }, ...props }: any): ReactNode => <Option label={title} title={title} icon={icon} {...props}>
			{ live && <Badge title={t('Started_a_video_call')} variant='primary'>!</Badge> }
		</Option>,
	} : null), [enableOption, groups, live, t]);
});

addAction('cf_video', ({ room }) => {
	const enabled = useSetting('Jitsi_Enabled');
	const t = useTranslation();

	const enabledChannel = useSetting('Jitsi_Enable_Channels');
	const enabledTeams = useSetting('Jitsi_Enable_Teams');

	const groups = useStableArray([
		'direct',
		'group',
		'live',
		enabledTeams && 'team',
		enabledChannel && 'channel',
	].filter(Boolean) as ToolboxActionConfig['groups']);

	const updatedRoom = useUserRoom(room._id);
	const currentTime = new Date().getTime();
	const jitsiTimeout = new Date((updatedRoom && updatedRoom.jitsiTimeout) || currentTime).getTime();
	const live = jitsiTimeout > currentTime || null;
	console.log(`updatedRoom (live = ${ live })`, updatedRoom);

	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal(null));

	const handleCancel = useMutableCallback(() => {
		closeModal();
	});
	const handleYes = useMutableCallback(() => {
		closeModal();
		const server = window.location.origin;
		const newWindow = window.open(server + FlowRouter.path('cf-jitsi', { roomid: room._id }), `cfchat_${ room._id }`);

		if (!newWindow) {
			console.log('<<< newWindow is null');
			toastr.info(t('Opened_in_a_new_window'));
			return;
		}
		newWindow.focus();
	});

	const action = useMutableCallback(() => {
		// const updatedRoom = useUserRoom(room._id);
		// const currentTime = new Date().getTime();
		// const jitsiTimeout = new Date((updatedRoom && updatedRoom.jitsiTimeout) || currentTime).getTime();
		// const live = jitsiTimeout > currentTime || null;

		console.log('click', room, live);

		if (room.t === 'd' || live) {
			handleYes();
			return;
		}

		setModal(() => <Modal>
			<Modal.Header>
				<Modal.Title>{t('Video_Conference')}</Modal.Title>
				<Modal.Close onClick={handleCancel} />
			</Modal.Header>
			<Modal.Content display='flex' flexDirection='column' alignItems='center'>
				{/* <Icon name='modal-warning' size='x128' color='warning-500' /> */}
				<i className='icon-phone' style={{ fontSize: '48px' }}></i>
				<Box fontScale='s1'>{t('Start_video_conference')}</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={handleCancel}>{t('Cancel')}</Button>
					<Button primary onClick={handleYes}>
						{t('Yes')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>);
	});

	return useMemo(() => (enabled ? {
		groups,
		id: 'cf_video',
		title: 'Call',
		icon: 'phone',
		action,
		template: '',
		order: live ? -1 : 4,
	} : null), [action, enabled, groups, live]);
});
