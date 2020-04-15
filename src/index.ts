import * as https from 'https';
import * as express from 'express';
import * as fs from "fs";
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';


const app = express();

const hippaCipherList = 'TLS13-AES-256-GCM-SHA384:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-CCM:DHE-RSA-AES128-CCM:DHE-RSA-AES256-CCM8:DHE-RSA-AES128-CCM8:DH-RSA-AES256-GCM-SHA384:DH-RSA-AES128-GCM-SHA256:ECDH-RSA-AES256-GCM-SHA384:ECDH-RSA-AES128-GCM-SHA256';

const server = https.createServer({
    minVersion: 'TLSv1.2',
    ciphers: hippaCipherList,
    cert: fs.readFileSync('./cert/cert.pem', 'utf8'),
    key: fs.readFileSync('./cert/key.pem', 'utf8'),
    ca: fs.readFileSync('./cert/ca-cert.pem', 'utf8')
},app);

const socket_server = https.createServer({
    minVersion: 'TLSv1.2',
    ciphers: hippaCipherList,
    cert: fs.readFileSync('./cert/cert.pem', 'utf8'),
    key: fs.readFileSync('./cert/key.pem', 'utf8'),
    ca: fs.readFileSync('./cert/ca-cert.pem', 'utf8')
},app);

const wss = new WebSocket.Server({ server: socket_server });
socket_server.listen(1011)
server.listen(1010);

app.get('/api/ventilator/', (request, response) => {
    response.contentType('application/json');
    response.send(JSON.stringify(ventilatorData));
});
app.get('/api/ventilator/:id', (request, response) => {
    response.contentType('application/json');
    response.send(JSON.stringify(ventilatorData[request.params.id]));
});

const ventilatorData: Record<string, any> = {};

const clients: Record<string, WebSocket> = {};

const createClient = (socket: WebSocket) => {
    const random = uuidv4();
    console.log(`new connection ${random}`);
    clients[random] = socket;
    socket.on('message', (data => {
        const jsonObject = JSON.parse(data.toString());
        if(jsonObject.type) {
            switch (jsonObject.type) {
                case 'ventilatorData':
                    ventilatorData[random] = jsonObject.data;
            }
        }
        socket.send(null);
    }))
    socket.on('error', (error: Error) => console.log(error))
}

wss.on('connection', (socket: WebSocket) => {
    createClient(socket);
})

wss.on('close', () => console.log("someone closed"))
