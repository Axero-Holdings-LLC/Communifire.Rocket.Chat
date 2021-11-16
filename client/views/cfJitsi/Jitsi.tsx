import { Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React, { FC, useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';

import { CustomSounds } from '../../../app/custom-sounds/client';
import { Notifications } from '../../../app/notifications/client';
import { HEARTBEAT, TIMEOUT, DEBOUNCE } from '../../../app/videobridge/constants';
import { IDirectMessageRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';
import { useConnectionStatus } from '../../contexts/ConnectionStatusContext';
import { useMethod } from '../../contexts/ServerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useUserRoom, useUser } from '../../contexts/UserContext';
import { JitsiBridge } from './JitsiBridge';

const querySettings = {
	_id: [
		'Jitsi_Open_New_Window',
		'Jitsi_Domain',
		'Jitsi_URL_Room_Hash',
		'uniqueID',
		'Jitsi_URL_Room_Prefix',
		'Jitsi_URL_Room_Suffix',
		'Jitsi_Chrome_Extension',
		// 'Jitsi_SSL',
		'Jitsi_Enabled_TokenAuth',
	],
};

const Jitsi: FC = () => {
	const rid = FlowRouter.getParam('roomid');
	const room = useUserRoom(rid);
	const user = useUser() as IUser | null;
	const { connected } = useConnectionStatus();
	const [accessToken, setAccessToken] = useSafely(useState());
	const [accepted, setAccepted] = useState(true);
	const generateAccessToken = useMethod('jitsi:generateAccessToken');
	const updateTimeout = useMethod('jitsi:updateTimeout');

	// const room2 = useReactiveValue(useCallback(() => Rooms.findOne({ _id: rid }), [rid]));
	// const user2 = Users.findOne({ username }, { fields: { avatarETag: 1 } });

	const [startedCall, setStartedCall] = useState(false);

	const handleClose = useMutableCallback(() => {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		handleClose2();
	});

	const handleStart = useMutableCallback((numParticipants: number) => {
		console.log(`<<< handleStart with ${numParticipants} participants`);
		if (Session.get('JitsiRinging')) {
			CustomSounds.play('ring', { volume: 0.5, loop: true });
		}
	});

	const ref = useRef();

	const {
		Jitsi_Domain: domain,
		Jitsi_Chrome_Extension: desktopSharingChromeExtId,
		Jitsi_URL_Room_Hash: useHashName,
		uniqueID,
		Jitsi_URL_Room_Prefix: prefix,
		Jitsi_URL_Room_Suffix: sufix,
		Jitsi_Enabled_TokenAuth: isEnabledTokenAuth,
	} = Object.fromEntries(useSettings(querySettings).map(({ _id, value }) => [_id, value]));

	useEffect(() => {
		let ignore = false;
		if (!isEnabledTokenAuth) {
			setAccessToken(undefined);
			return;
		}
		(async (): Promise<void> => {
			const accessToken = await generateAccessToken(rid);
			!ignore && setAccessToken(accessToken);
		})();
		return (): void => {
			ignore = true;
		};
	}, [generateAccessToken, isEnabledTokenAuth, rid, setAccessToken]);

	useLayoutEffect(() => {
		if (!connected) {
			//			handleClose();
		}
	}, [connected, handleClose]);

	const jitsiSubject =
		room &&
		(room.t === 'd' ? (room as unknown as IDirectMessageRoom).usernames.join(' x ') : room.name);

	const rname =
		useHashName || !room
			? uniqueID + rid
			: encodeURIComponent(
					room.t === 'd'
						? (room as unknown as IDirectMessageRoom).usernames.join(' x ')
						: room.name ?? '',
			  );

	const jitsi = useMemo(() => {
		if (isEnabledTokenAuth && !accessToken) {
			return;
		}

		console.log('<<< Creating JITSI API');

		const jitsiRoomName = prefix + rname + sufix;

		return new JitsiBridge(
			{
				domain,
				jitsiRoomName,
				jitsiSubject,
				accessToken,
				desktopSharingChromeExtId,
				name: user?.name || user?.username,
				handleClose,
				handleStart,
			},
			HEARTBEAT,
		);
	}, [
		accessToken,
		desktopSharingChromeExtId,
		domain,
		isEnabledTokenAuth,
		prefix,
		rname,
		sufix,
		user?.name,
		user?.username,
	]);

	const testAndHandleTimeout = useMutableCallback(() => {
		if (new Date().getTime() - new Date(room?.jitsiTimeout || 0).getTime() > TIMEOUT) {
			handleClose();
			return jitsi && jitsi.dispose();
		}

		if (new Date().getTime() - new Date(room?.jitsiTimeout || 0).getTime() + TIMEOUT > DEBOUNCE) {
			return updateTimeout(rid);
		}
	});

	const handleCallCancel = (action: string, roomid: string): void => {
		if (action !== 'cf_jitsi_cancel_call') return;
		console.log(`<<< CANCEL ${roomid}. Current room is ${rid}`);
		if (roomid == null || roomid === rid) {
			handleClose();
			jitsi?.dispose();
		}
	};

	useEffect(() => {
		if (!room || !user) {
			return;
		}
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();
		const live = jitsiTimeout > currentTime || null;

		console.log('<<< Video - room type', room?.t, accepted);

		if (room?.t === 'd' || live) setAccepted(true);

		console.log('<<< Video - room type', room?.t, accepted);

		console.log('<<< Live', live);

		if (!accepted || !jitsi) {
			return;
		}
		jitsi.start(ref.current);

		updateTimeout(rid);

		jitsi.on('HEARTBEAT', testAndHandleTimeout);

		const answering = Session.get('JitsiAnswering');
		const ringing = !!Session.get('JitsiRinging') && live;
		console.log('<<< ANSWERING', answering);
		console.log('<<< RINGING', ringing);
		console.log('<<< LIVE', live);

		const startingCall = !answering && !ringing && !live;
		setStartedCall(startingCall);

		console.log('<<< STARTING', startingCall);
		Notifications.notifyUser(Meteor.userId(), 'cf_jitsi_log', 'JITSI WINDOW STARTING'); // Notification to self

		if (startingCall) {
			Meteor.call('jitsi:comm_start_call', rid, (error: any) => {
				if (error) {
					console.log(error);
				}
			});
		}
		if (room.t === 'd') {
			if (startingCall) {
				// const user = Meteor.user();
				Notifications.notifyUsersOfRoom(
					rid,
					'webrtc',
					'cf_jitsi_ring_start',
					rid,
					user._id,
					user.username,
					(user as unknown as any).avatarUrl,
				);
				// CustomSounds.play('ring', { volume: 0.5, loop: true });
				Session.set('JitsiRinging', rid);
			} else {
				Notifications.notifyUsersOfRoom(rid, 'webrtc', 'cf_jitsi_ring_stop', rid);
				CustomSounds.play('ring', { volume: 0, loop: false });
				Session.set('JitsiAnswering', false);
				Session.set('JitsiRinging', false);

				// Be sure chat message is marked as accepted
				Meteor.call('jitsi:comm_accept_call', rid);
			}
		}

		Notifications.onUser('webrtc', handleCallCancel);

		if (answering) {
			Session.set('JitsiAnswering', false);
		}

		// return (): void => {};
	}, [accepted, jitsi, rid, testAndHandleTimeout, updateTimeout]);

	const handleClose2 = useMutableCallback(() => {
		if (!jitsi) {
			return;
		}
		Notifications.unUser('webrtc', handleCallCancel);
		jitsi.off('HEARTBEAT', testAndHandleTimeout);
		jitsi.dispose();
		console.log('<<<< **EXIT CALL**');

		Notifications.notifyUsersOfRoom(rid, 'webrtc', 'cf_jitsi_ring_stop', rid);
		CustomSounds.play('ring', { volume: 0, loop: false });
		Session.set('JitsiRinging', false);

		console.log('<<< Meteor Connected, started', Meteor.status().connected, startedCall);
		if (Meteor.status().connected) {
			Meteor.call('jitsi:comm_close_call', rid, startedCall);
			if (startedCall) {
				Notifications.notifyUsersOfRoom(rid, 'webrtc', 'cf_jitsi_cancel_call', rid);
			}
		}

		// Give time to send all signals before closing this window
		setTimeout(() => {
			window.close();
		}, 500);
	});

	window.onbeforeunload = handleClose2;

	return (
		<>
			<div ref={ref as unknown as any} />
			{!accepted && <Skeleton />}
		</>
	);
};

export default Jitsi;
