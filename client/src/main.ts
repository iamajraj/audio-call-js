import './style.css';

const loginScreen = document.getElementById('loginScreen');
const usernameInput = document.getElementById('username') as HTMLInputElement;
const joinForm = document.getElementById('joinForm');
const loginError = document.getElementById('loginError');

const callScreen = document.getElementById('callScreen');
const callBtn = document.getElementById('callBtn');
const hangUpBtn = document.getElementById('hangUpBtn');
const remoteUsernameInput = document.getElementById(
  'remoteUsername'
) as HTMLInputElement;
const localAudio = document.getElementById('localAudio') as HTMLAudioElement;
const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;

const onlineUsersContainer = document.getElementById('onlineUsers');

const ws = new WebSocket('ws://192.168.0.112:8080');

let name: string;
var connectedUser: string | null;

var yourConn: any | null;
var stream: any | null;

enum types {
  MESSAGE,
  ERROR,
  LOGIN,
  OFFER,
  ANSWER,
  CANDIDATE,
  LEAVE,
  ACTIVE_USERS,
}

type DataType = {
  type: types;
  data: any;
};

function toStr(obj: Object) {
  return JSON.stringify(obj);
}

function sendWS(type: types, data: any) {
  if (connectedUser) {
    data.name = connectedUser;
  }
  ws.send(
    toStr({
      type: type,
      data: data,
    })
  );
}

ws.onopen = (_) => {
  console.log('Connection is established!');
};

ws.onerror = (ev) => {
  console.log(`Error: `, ev);
};

ws.onmessage = (event) => {
  const { type, data }: DataType = JSON.parse(event.data);
  switch (type) {
    case types.LOGIN:
      handleLogin(data.success, data.msg);
      break;
    case types.OFFER:
      handleOffer(data.offer, data.name);
      break;
    case types.ANSWER:
      handleAnswer(data.answer);
      break;
    case types.CANDIDATE:
      handleCandidate(data.candidate);
      break;
    case types.LEAVE:
      handleLeave();
      break;
    case types.ACTIVE_USERS:
      handleActiveUsers(data.users);
      break;
    default:
      console.log('Command is not valid.');
  }
};

function handleActiveUsers(users: string[]) {
  onlineUsersContainer!.innerHTML = '';
  const elements = users.map((user) => {
    user = user === name ? 'You' : user;
    return `
    <li class="online-users-wrapper">
        <div class="online-signal"></div>
        <span>${user}</span>
    </li>
    `;
  });
  onlineUsersContainer!.innerHTML = elements.join('');
}

function handleLogin(success: boolean, msg: string) {
  if (success) {
    loginScreen!.style.display = 'none';
    callScreen!.style.display = 'flex';

    document.getElementById('loggedProfile')!.textContent = name[0];
    document.getElementById('loggedUserSignal')!.style.display = 'flex';

    (navigator as any).webkitGetUserMedia(
      { video: false, audio: true },
      (myStream: any) => {
        stream = myStream;

        localAudio.srcObject = stream;

        // const audioCtx = new AudioContext();
        // const analyser = audioCtx.createAnalyser();
        // analyser.fftSize = 256;
        // const audioSrc = audioCtx.createMediaElementSource(localAudio);
        // audioSrc.connect(analyser);
        // analyser.connect(audioCtx.destination);

        // const dataArray = new Float32Array(256);
        // analyser.getFloatFrequencyData(dataArray);
        // setInterval(() => {
        //   const zeros = dataArray.filter((v) => v === 0);
        //   const barWidth = dataArray.length - zeros.length;
        //   console.log(barWidth);
        // }, 1000);

        const config = {
          iceServers: [
            {
              urls: 'stun:stun2.1.google.com:19302',
            },
          ],
        };

        yourConn = new (window as any).webkitRTCPeerConnection(config);

        yourConn.addStream(stream);

        yourConn.onaddstream = (e: any) => {
          remoteAudio.srcObject = e.stream;
        };

        yourConn.onicecandidate = (e: any) => {
          if (e.candidate) {
            sendWS(types.CANDIDATE, {
              candidate: e.candidate,
            });
          }
        };
      },
      (err: any) => {
        console.log(err);
      }
    );
  } else {
    loginError!.textContent = msg;
  }
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  weekday: 'short',
});
const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour12: true,
  hour: '2-digit',
  minute: '2-digit',
});

document.getElementById('time')!.textContent = `${timeFormat.format(
  Date.now()
)} • ${dateFormat.format(Date.now())}`;

joinForm?.addEventListener('click', (e) => {
  e.preventDefault();
  name = usernameInput.value.trim();
  if (!name) return;
  sendWS(types.LOGIN, {
    name: name,
  });
});

callBtn?.addEventListener('click', () => {
  if (!remoteUsernameInput.value.trim()) return;

  connectedUser = remoteUsernameInput.value.trim();
  yourConn.createOffer(
    (offer: any) => {
      sendWS(types.OFFER, {
        offer,
      });

      yourConn.setLocalDescription(offer);
    },
    (_: any) => {
      alert('Error when creating offer');
    }
  );
});

function handleOffer(offer: any, name: string) {
  connectedUser = name;
  yourConn.setRemoteDescription(new RTCSessionDescription(offer));

  yourConn.createAnswer(
    (answer: any) => {
      yourConn.setLocalDescription(answer);

      sendWS(types.ANSWER, {
        answer,
      });
    },
    (_: any) => {
      console.log('Error when creating answer');
    }
  );
}
function handleAnswer(answer: any) {
  yourConn.setRemoteDescription(new RTCSessionDescription(answer));
}
function handleCandidate(candidate: any) {
  yourConn.addIceCandidate(new RTCIceCandidate(candidate));
}

hangUpBtn?.addEventListener('click', () => {
  sendWS(types.LEAVE, {});

  handleLeave();
});

function handleLeave() {
  connectedUser = null;
  (remoteAudio as any).src = null;

  yourConn.close();
  yourConn.onicecandidate = null;
  yourConn.onaddstream = null;
}
