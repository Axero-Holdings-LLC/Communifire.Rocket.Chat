// eslint-disable-next-line import/order
import { Emitter } from '@rocket.chat/emitter';

// import { JitsiMeetExternalAPI } from './Jitsi';

export class JitsiBridge extends Emitter {
	constructor(
		{
			openNewWindow,
			ssl,
			domain,
			jitsiRoomName,
			accessToken,
			desktopSharingChromeExtId,
			name,
			handleClose,
			handleStart,
			rid,
		},
		heartbeat,
	) {
		super();

		this.openNewWindow = openNewWindow;
		this.ssl = ssl;
		this.domain = domain;
		this.jitsiRoomName = jitsiRoomName;
		this.accessToken = accessToken;
		this.desktopSharingChromeExtId = desktopSharingChromeExtId;
		this.name = name;
		this.handleClose = handleClose;
		this.handleStart = handleStart;
		this.heartbeat = heartbeat;
		this.rid = rid;
		this.window = undefined;
		this.needsStart = false;
	}

	start(domTarget) {
		if (!this.needsStart) {
			return;
		}

		this.needsStart = false;

		const heartbeatTimer = setInterval(() => this.emit('HEARTBEAT', true), this.heartbeat);
		this.once('dispose', () => clearTimeout(heartbeatTimer));

		const {
			openNewWindow,
			// ssl,
			domain,
			jitsiRoomName,
			accessToken,
			desktopSharingChromeExtId,
			handleClose,
			handleStart,
			rid,
		} = this;

		// const protocol = ssl ? 'https://' : 'http://';

		// https://github.com/jitsi/jitsi-meet/blob/master/config.js
		const configOverwrite = {
			desktopSharingChromeExtId,
			startAudioOnly: true,
			// prejoinPageEnabled: true,
		};

		// See https://github.com/jitsi/jitsi-meet/blob/master/interface_config.js
		const interfaceConfigOverwrite = {
			HIDE_INVITE_MORE_HEADER: true,
		};

		if (openNewWindow) {
			console.log('<<< NEW WINDOW');
			// const queryString = accessToken ? `?jwt=${accessToken}` : '';
			// const newWindow = window.open(
			// 	`${protocol + domain}/${jitsiRoomName}${queryString}`,
			// 	jitsiRoomName,
			// );

			const server = window.location.origin;
			const newWindow = window.open(`${server}/jitsi/${rid}`, jitsiRoomName);

			if (!newWindow) {
				console.log('<<< newWindow is null');
				return;
			}

			const timer = setInterval(() => {
				if (newWindow.closed) {
					console.log('<<< newWindow is closed');
					this.dispose();
					handleClose();
				}
			}, 1000);

			this.once('dispose', () => clearTimeout(timer));
			this.window = newWindow;
			return newWindow.focus();
		}

		// const width = 'auto';
		// const width = 350;
		const width = undefined;
		const height = '100vh';

		const options = {
			roomName: jitsiRoomName,
			width,
			height,
			parentNode: domTarget,
			configOverwrite,
			interfaceConfigOverwrite,
			jwt: accessToken,
			onload: (e) => {
				e.target.style.height = height; // fix
			},
			//				api.getIFrame().style.height = '100vh';
		};

		const api = new window.JitsiMeetExternalAPI(domain, options);

		if (api.getIFrame()) {
			api.getIFrame().style.height = '100vh';
		}

		setTimeout(() => {
			// api.executeCommand('displayName', ['Hello']);
			api.executeCommand('toggleVideo', []);
			api.executeCommand('subject', 'New Conference Subject');

			// JLM
			api.addEventListener('incomingMessage', () => {
				console.log('<<< incomingMessage');
			});

			api.addEventListener('outgoingMessage', () => {
				console.log('<<< outgoingMessage');
			});

			api.addEventListener('displayNameChange', () => {
				console.log('<<< displayNameChange');
			});

			api.addEventListener('participantJoined', () => {
				console.log('<<< participantJoined');
			});

			api.addEventListener('participantLeft', () => {
				console.log('<<< participantLeft');
			});

			api.addEventListener('videoConferenceJoined', () => {
				console.log('<<< videoConferenceJoined');
				// {
				// 	roomName: string, // the room name of the conference
				// 	id: string, // the id of the local participant
				// 	displayName: string, // the display name of the local participant
				// 	avatarURL: string // the avatar URL of the local participant
				// }
				handleStart();
			});

			// api.addEventListener('videoConferenceLeft', () => {
			api.addEventListener('readyToClose', () => {
				console.log('<<< readyToClose');
				this.dispose();
				handleClose();
			});
		}, 1000);

		// JLM

		this.once('dispose', () => api.dispose());
	}

	dispose() {
		clearInterval(this.timer);
		this.emit('dispose', true);
	}
}
