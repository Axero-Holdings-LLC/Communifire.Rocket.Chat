import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models/server';
import { API } from '../api';
import { Notifications } from '../../../notifications/server';

API.v1.addRoute('video-conference/jitsi.update-timeout', { authRequired: true }, {
	post() {
		const { roomId, joiningNow = true } = this.bodyParams;
		if (!roomId) {
			return API.v1.failure('The "roomId" parameter is required!');
		}

		const room = Rooms.findOneById(roomId, { fields: { _id: 1 } });
		if (!room) {
			return API.v1.failure('Room does not exist!');
		}

		const jitsiTimeout = Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:updateTimeout', roomId, Boolean(joiningNow)));

		return API.v1.success({ jitsiTimeout });
	},
});

API.v1.addRoute('video-conference/jitsi.comm-start-call', { authRequired: true }, {
	post() {
		console.log('<<< START CALL');

		const { roomId } = this.bodyParams;
		if (!roomId) {
			return API.v1.failure('The "roomId" parameter is required!');
		}

		const room = Rooms.findOneById(roomId, { fields: { _id: 1, jitsiTimeout: 1, uids: 1, t: 1 } });
		if (!room) {
			return API.v1.failure('Room does not exist!');
		}
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();
		const live = jitsiTimeout > currentTime || null;

		console.log('<<< uids:', room.uids);

		const isHost = !live;
		console.log('<<< isHost', isHost);
		if (room.t === 'd' && room.uids) {
			if (isHost) {
				const that = this;
				Meteor.runAsUser(this.userId, () => {
					const { user } = that;
					room.uids.forEach((uid) => {
						if (uid !== that.userId) {
							Notifications.notifyUser(uid, 'webrtc', 'cf_jitsi_ring_start', roomId, this.userId, user.username, `/avatar/${ user.username }`);
						}
					});
				});
			} else {
				const that = this;
				room.uids.forEach((uid) => {
					if (uid !== that.userId) {
						Notifications.notifyUser(uid, 'webrtc', 'cf_jitsi_ring_stop', roomId);
					}
				});
			}
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:comm_start_call', roomId));

		return API.v1.success({ isHost });
	},
});

API.v1.addRoute('video-conference/jitsi.comm-close-call', { authRequired: true }, {
	post() {
		console.log('<<< CLOSE CALL');

		const { roomId, isHost } = this.bodyParams;
		if (!roomId) {
			return API.v1.failure('The "roomId" parameter is required!');
		}

		console.log('<<< parm isHost:', isHost);

		const room = Rooms.findOneById(roomId, { fields: { _id: 1, jitsiTimeout: 1, uids: 1, t: 1 } });
		if (!room) {
			return API.v1.failure('Room does not exist!');
		}

		if (!isHost) {
			if (room.t === 'd' && room.uids) {
				const that = this;
				room.uids.forEach((uid) => {
					if (uid !== that.userId) {
						Notifications.notifyUser(uid, 'webrtc', 'cf_jitsi_ring_stop', roomId);
					}
				});
			}
		}

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:comm_close_call', roomId, isHost));

		return API.v1.success({ result });
	},
});

API.v1.addRoute('video-conference/jitsi.comm-accept-call', { authRequired: true }, {
	post() {
		console.log('<<< ACCEPT CALL');

		const { roomId } = this.bodyParams;
		if (!roomId) {
			return API.v1.failure('The "roomId" parameter is required!');
		}

		const room = Rooms.findOneById(roomId, { fields: { _id: 1, jitsiTimeout: 1, uids: 1, t: 1 } });
		if (!room) {
			return API.v1.failure('Room does not exist!');
		}

		if (room.t === 'd' && room.uids) {
			const that = this;
			room.uids.forEach((uid) => {
				if (uid !== that.userId) {
					Notifications.notifyUser(uid, 'webrtc', 'cf_jitsi_ring_stop', roomId);
				}
			});
		}

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('jitsi:comm_accept_call', roomId));

		return API.v1.success({ result });
	},
});
