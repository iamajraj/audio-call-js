import './style.css';

const loginScreen = document.getElementById('loginScreen');
const usernameInput = document.getElementById('username') as HTMLInputElement;
const joinBtn = document.getElementById('joinBtn');
const loginError = document.getElementById('loginError');

// const callError = document.getElementById('callError');
const callScreen = document.getElementById('callScreen');
const callBtn = document.getElementById('callBtn');
const remoteUsernameInput = document.getElementById(
  'remoteUsername'
) as HTMLInputElement;
const localAudio = document.getElementById('localAudio') as HTMLAudioElement;
const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;

const ws = new WebSocket('ws://localhost:8080');

enum types {
  MESSAGE,
  ERROR,
  LOGIN,
  OFFER,
  ANSWER,
  CANDIDATE,
}

type DataType = {
  type: types;
  data: any;
};

function toStr(obj: Object) {
  return JSON.stringify(obj);
}

function sendWS(type: types, data: any) {
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
  const data: DataType = JSON.parse(event.data);
  switch (data.type) {
    case types.LOGIN:
      if (data.data.success) {
        loginScreen!.style.display = 'none';
        callScreen!.style.display = 'flex';
      } else {
        loginError!.textContent = data.data.msg;
      }
      break;
    default:
      console.log('Command is not valid.');
  }
};

joinBtn?.addEventListener('click', (_) => {
  if (!usernameInput.value.trim()) return;
  sendWS(types.LOGIN, {
    name: usernameInput.value,
  });
});
