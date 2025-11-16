import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';

let io = null;
const status = {
  opportunities: [],
  trades: [],
  logs: [],
  lastError: null
};

export async function startDashboard(port = 3000){
  const app = express();
  const server = http.createServer(app);
  // Basic dashboard auth: require DASHBOARD_SECRET header for socket connections and static files
  const secret = process.env.DASHBOARD_SECRET || null;
  if(secret){
    app.use((req, res, next)=>{
      const header = req.headers['x-dashboard-secret'];
      if(req.path.startsWith('/')){
        if(header !== secret){
          return res.status(401).send('Unauthorized');
        }
      }
      next();
    });
  }
  io = new Server(server, { cors: { origin: '*' } });

  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Socket auth via handshake
  io.use((socket, next) => {
    const secretHeader = socket.handshake.auth && socket.handshake.auth.secret;
    if(secret && secretHeader !== secret) return next(new Error('unauthorized'));
    return next();
  });
  io.on('connection', socket => {
    socket.emit('status:init', status);
  });

  server.listen(port, ()=> console.log(`Dashboard listening on http://0.0.0.0:${port}`));
}

function pushEvent(event, data){
  if(!io) return;
  try{ io.emit(event, data); }catch(e){}
}

export function emitOpportunity(opp){
  status.opportunities.unshift({time: Date.now(), ...opp});
  if(status.opportunities.length>50) status.opportunities.pop();
  pushEvent('opportunity', opp);
}

export function emitTrade(trade){
  status.trades.unshift({time: Date.now(), ...trade});
  if(status.trades.length>200) status.trades.pop();
  pushEvent('trade', trade);
}

export function emitLog(message){
  status.logs.unshift({time: Date.now(), message});
  if(status.logs.length>200) status.logs.pop();
  pushEvent('log', message);
}

export function emitError(err){
  status.lastError = {time: Date.now(), message: String(err)};
  pushEvent('error', status.lastError);
}
