import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Messages, Users } from '../../../models/server';
import { callbacks } from '../../../callbacks/server';
import { metrics } from '../../../metrics/server';
import * as CONSTANTS from '../../constants';
import { canSendMessage } from '../../../authorization/server';
import { SystemLogger } from '../../../logger/server';
// import { Notifications } from '../../../notifications/server';

Meteor.methods({
	// eslint-disable-next-line no-unused-vars
	'jitsi:updateTimeout': (rid, joiningNow = true) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:updateTimeout' });
		}

		const uid = Meteor.userId();

		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});

		try {
			const room = canSendMessage(rid, { uid, username: user.username, type: user.type });

			const currentTime = new Date().getTime();

			const jitsiTimeout = room.jitsiTimeout && new Date(room.jitsiTimeout).getTime();

			const nextTimeOut = new Date(currentTime + CONSTANTS.TIMEOUT);

			if (!jitsiTimeout || currentTime > jitsiTimeout - CONSTANTS.TIMEOUT / 2) {
				Rooms.setJitsiTimeout(rid, nextTimeOut);
			}

			Meteor.setTimeout(() => {
				const updatedRoom = canSendMessage(rid, { uid, username: user.username, type: user.type });
				const currentTime = new Date().getTime() - CONSTANTS.DEBOUNCE;
				// console.log('<<< Checking if chat is live', updatedRoom.jitsiTimeout > currentTime);
				if (updatedRoom.jitsiTimeout <= currentTime) {
					// console.log('<<<    It is not');
					Messages.jitsiCloseMessages(rid, TAPi18n.__('CF_call_closed'), { ended_at: new Date().getTime() });
				}
			}, CONSTANTS.TIMEOUT + CONSTANTS.DEBOUNCE);

			/* <<< JLM
			if (joiningNow && (!jitsiTimeout || currentTime > jitsiTimeout)) {
				metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

				const message = Messages.createWithTypeRoomIdMessageAndUser('jitsi_call_started', rid, '', Meteor.user(), {
					actionLinks: [
						{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), i18nLabel: 'Click_to_join', method_id: 'joinJitsiCall', params: '' },
					],
				});
				message.msg = TAPi18n.__('Started_a_video_call');
				callbacks.run('afterSaveMessage', message, { ...room, jitsiTimeout: currentTime + CONSTANTS.TIMEOUT });
			}
 			*/

			return jitsiTimeout || nextTimeOut;
		} catch (error) {
			SystemLogger.error('Error starting video call:', error);
			throw new Meteor.Error('error-starting-video-call', error.message);
		}
	},

	'jitsi:comm_start_call': (rid) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:close' });
		}

		// Close previous messages
		Messages.jitsiCloseMessages(rid, TAPi18n.__('CF_call_closed'), { ended_at: new Date().getTime() });

		const room = Rooms.findOneById(rid);

		const direct = room.t === 'd';

		const msgType = direct ? 'jitsi_comm_call_ring' : 'jitsi_comm_call_started';
		const text = direct ? TAPi18n.__('CF_calling') : TAPi18n.__('Started_a_video_call');
		const actionLinks = direct ? [] : [{ icon: 'icon-videocam', label: TAPi18n.__('CF_join_conference'), method_id: 'joinJitsiCall', params: '' }];

		const currentTime = new Date().getTime();
		metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736
		const message = Messages.createWithTypeRoomIdMessageAndUser(msgType, rid, text, Meteor.user(), {
			actionLinks,
			// attachments: [{ text }],
		});
		message.msg = TAPi18n.__('Started_a_video_call');
		message.mentions = [
			{
				_id: 'here',
				username: 'here',
			},
		];
		callbacks.run('afterSaveMessage', message, { ...room, jitsiTimeout: currentTime + CONSTANTS.TIMEOUT });
	},

	'jitsi:comm_accept_call': (rid) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:comm_accept_call' });
		}

		Messages.jitsiStartMessages(rid, TAPi18n.__('Started_a_video_call'));
	},

	'jitsi:comm_close_call': (rid, isHost) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:close' });
		}
		// const uid = Meteor.userId();
		// const user = Users.findOneById(uid, {
		// 	fields: {
		// 		username: 1,
		// 		type: 1,
		// 	},
		// });

		if (isHost) {
			// const room = canSendMessage(rid, { uid, username: user.username, type: user.type });
			// if (room.t === 'd') {
			Rooms.setJitsiTimeout(rid, 0);
			// }
			Messages.jitsiCloseMessagesByType(rid, TAPi18n.__('CF_call_missed'), TAPi18n.__('CF_call_ended'), { ended_at: new Date().getTime() });

			// Notifications.notifyUsers(rid, 'webrtc', 'cf_jitsi_cancel_call', rid);
		}
		// else {
		// 	Meteor.setTimeout(() => {
		// 		const room = canSendMessage(rid, { uid, username: user.username, type: user.type });
		// 		const currentTime = new Date().getTime();
		// 		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();
		// 		const live = jitsiTimeout > currentTime || null;
		// 		if (!live) {
		// 			Messages.jitsiCloseMessages(rid, TAPi18n.__('CF_call_ended'), { ended_at: new Date().getTime() });
		// 		}
		// 	}, CONSTANTS.TIMEOUT + CONSTANTS.DEBOUNCE);
		// }
	},
});
