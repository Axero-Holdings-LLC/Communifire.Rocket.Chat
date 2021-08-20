import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';
import toastr from 'toastr';

import { actionLinks } from '../../action-links/client';
import { Rooms } from '../../models';

// eslint-disable-next-line no-unused-vars
actionLinks.register('joinJitsiCall', function(message, params, instance) {
	console.log('<<<< actionLink joinJitsiCall (client)');
	if (Session.get('openedRoom')) {
		const rid = Session.get('openedRoom');

		const room = Rooms.findOne({ _id: rid });
		const username = Meteor.user()?.username;
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (room && room.muted.includes(username)) {
					toastr.error(TAPi18n.__('You_have_been_muted', ''));
		} else if (jitsiTimeout > currentTime) {
			Session.set('JitsiAnswering', rid);
			// instance.tabBar.open('video');
			const server = window.location.origin;
			const newWindow = window.open(server + FlowRouter.path('cf-jitsi', { roomid: room._id }), `cfchat_${ room._id }`);

			if (!newWindow) {
				console.log('<<< newWindow is null');
				toastr.info(TAPi18n.__('Opened_in_a_new_window'));
				return;
			}
			newWindow.focus();
		} else {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		}
	}
});

actionLinks.register('joinJitsiCall_old', function(message, params, instance) {
	if (Session.get('openedRoom')) {
		const rid = Session.get('openedRoom');

		const room = Rooms.findOne({ _id: rid });
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (room && room?.muted.includes(username)) {
			toastr.error(TAPi18n.__('You_have_been_muted', ''));
		} else if (jitsiTimeout > currentTime) {
			Session.set('JitsiAnswering', rid);
			instance.tabBar.open('video');
		} else {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		}
	}
});
