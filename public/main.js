const socket = io();

function addItem(containerId, html){
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = html;
  document.getElementById(containerId).appendChild(div);
}

socket.on('status:init', (s)=>{
  if(s.opportunities) s.opportunities.slice(0,50).forEach(o=> addItem('opps', `<b>${o.description}</b><br/>EstimatedOut: ${o.estimatedOutWei}<br/>EstimatedIn: ${o.estimatedInWei}`));
  if(s.trades) s.trades.slice(0,50).forEach(t=> addItem('trades', `<b>${t.opportunity}</b><br/>Profit: ${t.profit}<br/>tx: ${t.tx}`));
  if(s.logs) s.logs.slice(0,50).forEach(l=> addItem('logs', `<small>${new Date(l.time).toLocaleString()}</small><br/>${l.message}`));
});

socket.on('opportunity', (o)=>{
  addItem('opps', `<b>${o.description}</b><br/>Profit est: ${BigInt(o.estimatedOutWei||0) - BigInt(o.estimatedInWei||0)}`);
});

socket.on('trade', (t)=>{
  addItem('trades', `<b>${t.opportunity ? t.opportunity.description || t.opportunity : 'trade'}</b><br/>Profit: ${t.profit}<br/>tx: ${t.tx}`);
});

socket.on('log', (m)=> addItem('logs', `<small>${new Date().toLocaleString()}</small><br/>${m}`));
socket.on('error', (e)=> addItem('logs', `<b style='color:red'>ERROR</b><br/>${e.message}`));
