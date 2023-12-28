import { WebSocketServer, WebSocket, Data, CONNECTING } from 'ws';

type ExtendedWebSocket = WebSocket & { name?: string; otherName?: string };

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

const wss = new WebSocketServer({
  port: 8080,
});

const users: Record<string, ExtendedWebSocket> = {};

wss.on('connection', (socket: ExtendedWebSocket) => {
  socket.on('message', (msg) => {
    const { type, data }: DataType = JSON.parse(msg.toString());

    switch (type) {
      case types.LOGIN:
        if (users[data.name]) {
          sendWS(socket, types.LOGIN, {
            success: false,
            msg: 'The username is already exists.',
          });
        } else {
          users[data.user] = socket;
          socket.name = data.name;
          sendWS(socket, types.LOGIN, {
            success: true,
            msg: 'User has been successfully logged in!',
          });
        }
        break;
      case types.OFFER:
        console.log('Sending offer to: ', data.name);
        var otherSocket = users[data.name];
        if (otherSocket != null) {
          socket.otherName = data.name;
          sendWS(otherSocket, types.OFFER, {
            offer: data.offer,
            name: socket.name,
          });
        }
        break;
      case types.ANSWER:
        console.log('Sending answer to: ', data.name);
        var otherSocket = users[data.name];

        if (otherSocket != null) {
          socket.otherName = data.name;
          sendWS(otherSocket, types.ANSWER, {
            answer: data.answer,
          });
        }
        break;
      case types.CANDIDATE:
        console.log('Sending Candidate to: ', data.name);
        break;
      default:
        console.log('Command not found');
    }
  });

  socket.on('close', () => {
    if (socket.name) {
      delete users[socket.name];
    }
  });
});

wss.on('listening', () => {
  console.log(`Server is listening on port: ${wss.options.port}`);
});

wss.on('error', (err) => {
  console.error(`Error: ${err}`);
});

function sendWS(socket: ExtendedWebSocket, type: types, data: any) {
  socket.send(
    toStr({
      type: type,
      data: data,
    })
  );
}

function toStr(obj: DataType) {
  return JSON.stringify(obj);
}
