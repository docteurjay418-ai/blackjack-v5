const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const money=n=>'$'+Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const SUITS=['♠','♥','♦','♣'], RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K']; const COLOR=s=>(s==='♥'||s==='♦')?'red':'black';
let shoe=[], pen=0;
function buildShoe(decks=6){ const cards=[]; for(let d=0;d<decks;d++){ for(const s of SUITS){ for(const r of RANKS){ cards.push({rank:r,suit:s}); } } }
  for(let i=cards.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cards[i],cards[j]]=[cards[j],cards[i]]; }
  shoe=cards; pen=Math.floor(cards.length*0.75); toast('Nouveau shoe 6 decks.'); }
function drawCard(){ if(shoe.length<=pen) buildShoe(); return shoe.pop(); }
function handValue(cards){ let total=0, aces=0; for(const c of cards){ if(c.rank==='A'){aces++; total+=11;} else if(['10','J','Q','K'].includes(c.rank)){ total+=10; } else total+=parseInt(c.rank,10); }
  while(total>21 && aces>0){ total-=10; aces--; } const soft=(aces>0 && total<=21); const isBJ=(cards.length===2 && total===21); return {total,soft,isBJ}; }
function createCardEl(card, hidden=false){ const wrap=document.createElement('div'); wrap.className='card-wrap'; const el=document.createElement('div'); el.className='card flip'+(hidden?' flipped':'');
  if(COLOR(card.suit)==='red') el.classList.add('red');
  const front=document.createElement('div'); front.className='front'; front.style.position='absolute'; front.style.inset='0'; front.style.borderRadius='10px'; front.style.backfaceVisibility='hidden';
  const tl=document.createElement('div'); tl.className='corner'; tl.innerHTML=`<div class="rank">${card.rank}</div><div class="suit">${card.suit}</div>`;
  const br=tl.cloneNode(true); br.classList.add('br'); front.appendChild(tl); front.appendChild(br);
  placePips(front,card.rank,card.suit);
  const back=document.createElement('div'); back.className='backface'; el.appendChild(front); el.appendChild(back); wrap.appendChild(el); return wrap; }
const PIP_POS={ top:[{x:50,y:16}], mid:[{x:50,y:50}], bot:[{x:50,y:84}], quads:[{x:30,y:28},{x:70,y:28},{x:30,y:72},{x:70,y:72}], six:[{x:30,y:22},{x:70,y:22},{x:30,y:50},{x:70,y:50},{x:30,y:78},{x:70,y:78}],
  seven:[{x:50,y:14},{x:30,y:26},{x:70,y:26},{x:30,y:50},{x:70,y:50},{x:30,y:74},{x:70,y:74}], eight:[{x:30,y:22},{x:70,y:22},{x:30,y:38},{x:70,y:38},{x:30,y:62},{x:70,y:62},{x:30,y:78},{x:70,y:78}],
  nine:[{x:50,y:14},{x:30,y:26},{x:70,y:26},{x:30,y:42},{x:70,y:42},{x:50,y:50},{x:30,y:66},{x:70,y:66},{x:50,y:84}],
  ten:[{x:30,y:18},{x:70,y:18},{x:30,y:34},{x:70,y:34},{x:30,y:50},{x:70,y:50},{x:30,y:66},{x:70,y:66},{x:30,y:82},{x:70,y:82}] };
function placePips(container,rank,suit){ const add=pts=>pts.forEach(p=>{ const pip=document.createElement('div'); pip.className='pip'; pip.textContent=suit; pip.style.left=p.x+'%'; pip.style.top=p.y+'%'; pip.style.position='absolute'; pip.style.transform='translate(-50%,-50%)'; container.appendChild(pip); });
  switch(rank){ case 'A': add(PIP_POS.mid); break; case '2': add([PIP_POS.top[0],PIP_POS.bot[0]]); break; case '3': add([PIP_POS.top[0],PIP_POS.mid[0],PIP_POS.bot[0]]); break;
  case '4': add(PIP_POS.quads); break; case '5': add([...PIP_POS.quads,PIP_POS.mid[0]]); break; case '6': add(PIP_POS.six); break; case '7': add(PIP_POS.seven); break;
  case '8': add(PIP_POS.eight); break; case '9': add(PIP_POS.nine); break; case '10': add(PIP_POS.ten); break;
  case 'J': case 'Q': case 'K': const face=document.createElement('div'); face.className='face'; face.textContent=suit; container.appendChild(face); break; } }
function toast(msg,ms=1400){ const t=$("#toast"); t.textContent=msg; t.style.display='block'; clearTimeout(t._to); t._to=setTimeout(()=>t.style.display='none',ms); }

const state={ balance:5000,lastBets:[0,0,0],bets:[0,0,0],hands:[[],[],[]],dealer:[],activeSeat:0,activeHand:0,inRound:false,stats:{hands:0,won:0,lost:0,push:0},win:0 };
class Hand{ constructor(bet){ this.bet=bet; this.cards=[]; this.done=false; this.surrender=false; this.doubled=false; this.insurance=0; this.isSplitAce=false; }}

function renderTop(){ $("#balance").textContent=money(state.balance); $("#totalBet").textContent=money(totalBet()); $("#winAmt").textContent=money(state.win); }
function renderStats(){ const s=state; $("#stats").textContent=`Hands: ${s.stats.hands} • Won: ${s.stats.won} • Lost: ${s.stats.lost} • Push: ${s.stats.push}`; }
function totalBet(){ return state.bets.reduce((a,b)=>a+b,0); }

// Vegas-style colors for mini stack chips
const CHIP_COLORS={0.5:'#e6e6e6',1:'#1f60d6',5:'#d33a2c',25:'#2e9a2e',100:'#111111',500:'#6b37c8',1000:'#f39c12',5000:'#7a1f2e'};
const DENOMS=[5000,1000,500,100,25,5,1,0.5];
function makeMiniChip(color){ const d=document.createElement('div'); d.className='chip-mini'; d.style.background=color; return d; }
function amountToChipStack(amount){ const stack=[]; let rem=+amount.toFixed(2);
  for(const d of DENOMS){ let n = (d===0.5) ? Math.round((rem + 1e-6)/d) : Math.floor(rem/d); for(let i=0;i<n;i++) stack.push(d); rem = +(rem - d*n).toFixed(2); }
  return stack.slice(0,12);
}
function renderSeatStack(idx){
  const seat=document.querySelector(`.seat[data-idx="${idx}"]`);
  const stackEl=seat.querySelector('.stack');
  const amtEl=seat.querySelector('.amt');
  const v=state.bets[idx];
  stackEl.innerHTML='';
  if(v<=0){ amtEl.textContent='BET'; return; }
  // Build canonical stack (auto-consolidated by denomination)
  const chips=amountToChipStack(v);
  // Perfect centered stacking: each chip exactly covers the previous
  chips.forEach((val)=>{
    const c=document.createElement('div');
    c.className='chip chip-seat';
    c.dataset.v=String(val);
    const label = val>=1000 ? `$${val/1000}k` : `$${val}`;
    c.innerHTML = `<small>${label}</small>`;
    c.style.transform = 'translate(-50%, -50%)';
    stackEl.appendChild(c);
  });
  amtEl.textContent=money(v);
}
function refreshBetsUI(){ for(let i=0;i<3;i++) renderSeatStack(i); renderTop(); }
function clearBets(){ state.bets=[0,0,0]; refreshBetsUI(); }
function rebet(){ state.bets=[...state.lastBets]; refreshBetsUI(); }

function createAndAnimateCard(toEl, card, faceUp=true){ const temp=createCardEl(card,true); document.body.appendChild(temp);
  const start=document.querySelector("#shoeOrigin").getBoundingClientRect(); const end=toEl.getBoundingClientRect();
  const cx=start.left+start.width/2, cy=start.top+start.height/2, tx=end.left+end.width/2, ty=end.top+end.height/2;
  temp.style.position='fixed'; temp.style.left=(cx-37)+'px'; temp.style.top=(cy-52)+'px'; temp.style.transition='transform .35s cubic-bezier(.2,.7,.25,1)';
  requestAnimationFrame(()=>{ temp.style.transform=`translate(${tx-cx}px, ${ty-cy}px) rotate(${Math.floor(Math.random()*9-4)}deg)`; });
  return new Promise(res=>{ temp.addEventListener('transitionend', ()=>{ const real=createCardEl(card,!faceUp); toEl.appendChild(real); if(faceUp){ setTimeout(()=>{ real.querySelector('.card').classList.remove('flipped'); }, 20); } temp.remove(); res(); }, {once:true}); });
}
function flipHoleCard(){ const row=document.querySelector("#dealerRow"); const last=row.children[1]; if(!last) return; last.querySelector('.card').classList.remove('flipped'); }

function pathArc(x1,y1,x2,y2,curve=0.3){ const dx=x2-x1; const cx1=x1+dx*curve, cy1=y1-80; const cx2=x2-dx*curve, cy2=y2-80; return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`; }
function animateChipsPath(fromRect, toRect, count=8){
  for(let i=0;i<count;i++){ const el=document.createElement('div'); el.className='motion'; document.body.appendChild(el);
    const sx=fromRect.left+fromRect.width/2+(Math.random()*20-10), sy=fromRect.top+fromRect.height/2+(Math.random()*16-8);
    const tx=toRect.left+toRect.width/2+(Math.random()*20-10), ty=toRect.top+toRect.height/2+(Math.random()*16-8);
    el.style.offsetPath = `path('${pathArc(sx,sy,tx,ty)}')`; setTimeout(()=>el.remove(), 720); }
}

function renderAllHands(){
  const drow=document.querySelector("#dealerRow"); drow.innerHTML='';
  state.dealer.forEach((c,i)=>{ const hide=state.inRound && i===1 && !allPlayersDone(); const host=document.createElement('div'); drow.appendChild(host); const el=createCardEl(c, hide); host.appendChild(el); if(!hide) setTimeout(()=> el.querySelector('.card').classList.remove('flipped'), 0); });
  const dv=handValue(state.dealer); document.querySelector("#dealerTotal").textContent=(state.inRound && !allPlayersDone()? '—' : (dv.total<=21? (dv.total+(dv.soft?' (soft)':'')) : 'BUST'));
  document.querySelectorAll(".seat").forEach((seat,i)=>{ const area=seat.querySelector('.hand-area'); area.innerHTML='<div class="total-tag">—</div>'; const hands=state.hands[i]||[]; hands.forEach((h,hi)=>{
    const wrap=document.createElement('div'); wrap.style.display='inline-flex'; wrap.style.marginRight='12px';
    h.cards.forEach(c=>{ const host=document.createElement('div'); wrap.appendChild(host); const el=createCardEl(c,false); host.appendChild(el); setTimeout(()=>el.querySelector('.card').classList.remove('flipped'),0); });
    area.appendChild(wrap); const v=handValue(h.cards); const totalEl=area.querySelector('.total-tag'); totalEl.textContent=v.total<=21? v.total+(v.soft?' (soft)':'') : 'BUST';
    if(i===state.activeSeat && hi===state.activeHand && state.inRound && !h.done){ totalEl.style.outline='3px solid rgba(255,255,255,.45)'; } else totalEl.style.outline='none'; }); });
}

function showBettingControls(show){ document.querySelectorAll('[data-group="bet"]').forEach(b=>b.classList.toggle('hidden', !show)); }
function setActionVisibility({hit,stand,double,split,surrender}){
  document.querySelector('#hit').classList.toggle('hidden', !hit);
  document.querySelector('#stand').classList.toggle('hidden', !stand);
  document.querySelector('#double').classList.toggle('hidden', !double);
  document.querySelector('#split').classList.toggle('hidden', !split);
  document.querySelector('#surrender').classList.toggle('hidden', !surrender);
}
function refreshControls(){ if(!state.inRound){ showBettingControls(true); setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false}); } else { showBettingControls(false); updateActionsForActive(); } }

function allPlayersDone(){
  for(let s=0;s<3;s++){
    const hands=state.hands[s]||[];
    for(const h of hands){ if(!h.done && !h.surrender) return false; }
  }
  return true;
}

let selectedChip=5; function selectChip(v){ selectedChip=+v; document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', +c.dataset.v===selectedChip)); }
selectChip(5);
document.querySelector('#customChipBtn').addEventListener('click',()=>{ const val=parseFloat(prompt('Montant du jeton personnalisé:','50')); if(!isFinite(val)||val<=0) return;
  const chip=document.createElement('div'); chip.className='chip'; chip.dataset.v=String(val); chip.innerHTML=`<small>$${val}</small>`; document.querySelector('#chips').insertBefore(chip,document.querySelector('#customChipBtn'));
  chip.addEventListener('click',()=>selectChip(val)); selectChip(val); });
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>selectChip(c.dataset.v)));
document.querySelectorAll('.seat').forEach(seat=>{ const idx=+seat.dataset.idx;
  const circle = seat.querySelector('.circle');
  circle.addEventListener('click',()=>{ if(state.inRound) return; state.bets[idx]=+(state.bets[idx]+selectedChip).toFixed(2); state.lastBets[idx]=state.bets[idx]; renderSeatStack(idx); renderTop(); });
  circle.addEventListener('contextmenu',e=>{ e.preventDefault(); if(state.inRound) return; state.bets[idx]=Math.max(0, +(state.bets[idx]-selectedChip).toFixed(2)); renderSeatStack(idx); renderTop(); });
  // Removed dblclick-to-clear to prevent accidental reset when clicking fast
});

function anyBet(){ return state.bets.some(v=>v>0); }

async function startRound(){
  if(state.inRound) return; if(!anyBet()){ toast('Place ta mise d’abord.'); return; }
  const total=totalBet(); if(state.balance<total){ toast('Solde insuffisant. Clique BALANCE.'); return; }
  state.stats.hands++; state.win=0; state.balance-=total; state.hands=[[],[],[]]; state.dealer=[];
  for(let i=0;i<3;i++){ if(state.bets[i]>0){ state.hands[i].push(new Hand(state.bets[i])); } }
  state.dealer.push(drawCard(), drawCard()); state.activeSeat=state.bets.findIndex(v=>v>0); state.activeHand=0; state.inRound=true;
  const order=[]; for(let r=0;r<2;r++){ for(let s=0;s<3;s++){ if(state.bets[s]>0) order.push({seat:s}); } order.push({dealer:true, hide:r===1}); }
  for(const step of order){
    if(step.dealer){ const row=document.querySelector("#dealerRow"); const slot=document.createElement('div'); row.appendChild(slot); const card = step.hide ? state.dealer[1] : state.dealer[0]; await createAndAnimateCard(slot, card, !step.hide); }
    else{ const s=step.seat; const h=state.hands[s][0]; const newc=drawCard(); h.cards.push(newc); const area=document.querySelector(`.seat[data-idx="${s}"] .hand-area`); const slot=document.createElement('div'); area.appendChild(slot); await createAndAnimateCard(slot, newc, true); }
  }
  renderAllHands(); renderTop(); renderStats(); refreshControls();
}

function currentHand(){ return (state.hands[state.activeSeat]||[])[state.activeHand]; }
function moveToNextHand(){ for(let s=state.activeSeat;s<3;s++){ const hands=state.hands[s]||[]; for(let i=(s===state.activeSeat?state.activeHand+1:0); i<hands.length; i++){ if(!hands[i].done){ state.activeSeat=s; state.activeHand=i; return true; } } } return false; }

function updateActionsForActive(){
  if(!state.inRound){ setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false}); return; }
  const h=currentHand(); if(!h){ setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false}); return; }
  const v=handValue(h.cards);
  const canHit = v.total<21 && !(h.isSplitAce && h.cards.length>=2);
  const canStand = true;
  const canDouble = (h.cards.length===2) && state.balance>=h.bet && !(h.isSplitAce);
  const v10=r=>['10','J','Q','K'].includes(r);
  const canSplit = (h.cards.length===2) && (h.cards[0].rank===h.cards[1].rank || (v10(h.cards[0].rank)&&v10(h.cards[1].rank))) && state.balance>=h.bet && (state.hands[state.activeSeat].length<4);
  const canSurrender = (h.cards.length===2);
  setActionVisibility({hit:canHit, stand:canStand, double:canDouble, split:canSplit, surrender:canSurrender});
}

function dealerPlayThenSettle(){
  flipHoleCard();
  setTimeout(()=>{
    let dv=handValue(state.dealer);
    const loop=()=>{
      if(dv.total<17 || (dv.total===17 && dv.soft)){
        const row=document.querySelector("#dealerRow"); const host=document.createElement('div'); row.appendChild(host);
        const c=drawCard(); state.dealer.push(c);
        createAndAnimateCard(host,c,true).then(()=>{ dv=handValue(state.dealer); setTimeout(loop, 220); });
      } else { settlePayouts(); }
    };
    loop();
  }, 220);
}

function seatRect(idx){ return document.querySelector(`.seat[data-idx="${idx}"] .circle`).getBoundingClientRect(); }
function dealerRect(){ return document.querySelector("#dealerBank").getBoundingClientRect(); }

function settlePayouts(){
  const dRect=dealerRect(); let win=0;
  for(let s=0;s<3;s++){
    for(const h of (state.hands[s]||[])){
      const pv=handValue(h.cards); const dv=handValue(state.dealer); let out=0;
      if(h.surrender){ out=-h.bet/2; animateChipsPath(seatRect(s), dRect, 8); state.stats.lost++; }
      else if(pv.total>21){ out=-h.bet; animateChipsPath(seatRect(s), dRect, 10); state.stats.lost++; }
      else{
        const dealerBJ=dv.isBJ; const bj=(pv.isBJ && h.cards.length===2 && !h.doubled && !h.surrender);
        if(dv.total>21){ out=h.bet; if(bj) out=h.bet*1.5; animateChipsPath(dRect, seatRect(s), 12); state.stats.won++; }
        else if(bj && !dealerBJ){ out=h.bet*1.5; animateChipsPath(dRect, seatRect(s), 14); state.stats.won++; }
        else if(!bj && dealerBJ){ out=-h.bet; animateChipsPath(seatRect(s), dRect, 10); state.stats.lost++; }
        else if(pv.total>dv.total){ out=h.bet; animateChipsPath(dRect, seatRect(s), 12); state.stats.won++; }
        else if(pv.total<dv.total){ out=-h.bet; animateChipsPath(seatRect(s), dRect, 10); state.stats.lost++; }
        else { out=0; state.stats.push++; }
      }
      state.balance += out + h.bet; win += out;
    }
  }
  state.win=win; renderTop(); renderStats(); toast(win>=0?`Tu gagnes ${money(win)}`:`Tu perds ${money(-win)}`,1800);
  state.inRound=false; refreshControls();
}

document.querySelector('#deal').addEventListener('click', startRound);
document.querySelector('#clearBets').addEventListener('click',()=>{ if(state.inRound) return; clearBets(); });
document.querySelector('#rebet').addEventListener('click',()=>{ if(state.inRound) return; rebet(); });
document.querySelector('#shuffle').addEventListener('click', buildShoe);

document.querySelector('#hit').addEventListener('click',async()=>{
  const h=currentHand(); if(!h) return; const v0=handValue(h.cards); if(v0.total>=21) return;
  const newc=drawCard(); h.cards.push(newc);
  const area=document.querySelector(`.seat[data-idx="${state.activeSeat}"] .hand-area`); const slot=document.createElement('div'); area.appendChild(slot);
  await createAndAnimateCard(slot, newc, true);
  const v=handValue(h.cards); if(v.total>=21 || h.isSplitAce){ h.done=true; if(!moveToNextHand()) dealerPlayThenSettle(); }
  renderAllHands(); updateActionsForActive();
});
document.querySelector('#stand').addEventListener('click',()=>{ const h=currentHand(); if(!h) return; h.done=true; if(!moveToNextHand()) dealerPlayThenSettle(); else updateActionsForActive(); renderAllHands(); });
document.querySelector('#double').addEventListener('click',async()=>{
  const h=currentHand(); if(!h||h.cards.length!==2) return; if(state.balance<h.bet){ toast('Solde insuffisant.'); return; }
  state.balance-=h.bet; h.bet*=2; h.doubled=true;
  const newc=drawCard(); h.cards.push(newc);
  const area=document.querySelector(`.seat[data-idx="${state.activeSeat}"] .hand-area`); const slot=document.createElement('div'); area.appendChild(slot);
  await createAndAnimateCard(slot, newc, true); h.done=true; renderTop();
  if(!moveToNextHand()) dealerPlayThenSettle(); else updateActionsForActive(); renderAllHands();
});
document.querySelector('#split').addEventListener('click',()=>{
  const h=currentHand(); if(!h||h.cards.length!==2) return; if(state.balance<h.bet){ toast('Solde insuffisant.'); return; }
  state.balance-=h.bet; const c2=h.cards.pop(); const h2=new Hand(h.bet); h2.cards=[c2]; h.cards=[h.cards[0]]; h.cards.push(drawCard()); h2.cards.push(drawCard());
  if(h.cards[0].rank==='A'){ h.isSplitAce=true; h.done=true; } if(h2.cards[0].rank==='A'){ h2.isSplitAce=true; h2.done=true; }
  state.hands[state.activeSeat].splice(state.activeHand+1,0,h2); renderTop(); renderAllHands(); updateActionsForActive();
});
document.querySelector('#surrender').addEventListener('click',()=>{ const h=currentHand(); if(!h||h.cards.length!==2) return; h.surrender=true; h.done=true; renderAllHands(); if(!moveToNextHand()) dealerPlayThenSettle(); else updateActionsForActive(); });

document.querySelector('#balance').addEventListener('click',()=>{ const v=parseFloat(prompt('Définir le solde :', state.balance)); if(!isFinite(v)||v<0) return; state.balance=+v.toFixed(2); renderTop(); });
document.addEventListener('keydown',e=>{ const k=e.key.toLowerCase();
  if(k==='d') document.querySelector('#deal').click(); else if(k==='h') document.querySelector('#hit').click(); else if(k==='s') document.querySelector('#stand').click(); else if(k==='2') document.querySelector('#double').click();
  else if(k==='p') document.querySelector('#split').click(); else if(k==='u') document.querySelector('#surrender').click(); else if(k==='r' && !state.inRound) document.querySelector('#rebet').click(); else if(k==='c' && !state.inRound) document.querySelector('#clearBets').click(); });

function init(){ buildShoe(); refreshBetsUI(); renderTop(); renderStats(); refreshControls(); }
init();
