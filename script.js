const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const money=n=>'$'+Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const SUITS=['♠','♥','♦','♣'], RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K']; const COLOR=s=>(s==='♥'||s==='♦')?'red':'black';

/* ====================== RÉGLAGES D'AFFICHAGE ====================== */
// 'natural' -> "BLACKJACK!" seulement pour 21 en 2 cartes (A + 10/J/Q/K)
// 'any21'   -> "BLACKJACK!" dès que la main vaut 21 au meilleur total (même à 3+ cartes)
const RULES = { blackjackLabelMode: 'any21' };


// ============================== Utils Cartes =============================
// Accepte objets {rank:'A'..'K', suit:'S'|'H'|'D'|'C'|symbol} ou chaînes "AS","10H","QD","3C"
const SUIT_LETTER_TO_SYMBOL={ S:'♠', H:'♥', D:'♦', C:'♣' };
function normalizeCard(card){
  if(typeof card==='string'){
    const r=card.slice(0, card.length-1).toUpperCase();
    const sLetter=card.slice(-1).toUpperCase();
    const s = SUIT_LETTER_TO_SYMBOL[sLetter] || sLetter;
    return {rank:r, suit:s};
  }
  if(card && typeof card==='object'){
    const rank = String(card.rank).toUpperCase();
    let suit = card.suit;
    if(typeof suit==='string' && suit.length==1 && SUIT_LETTER_TO_SYMBOL.get?.(suit.toUpperCase())) suit = SUIT_LETTER_TO_SYMBOL[suit.toUpperCase()];
    else if(typeof suit==='string' && suit.length==1 && suit.toUpperCase() in SUIT_LETTER_TO_SYMBOL) suit = SUIT_LETTER_TO_SYMBOL[suit.toUpperCase()];
    return {rank, suit};
  }
  return card;
}
function baseValue(rank){
  if(rank==='A') return 1; // compter d'abord les As à 1
  if(rank==='K'||rank==='Q'||rank==='J') return 10;
  return Number(rank);
}
function allHandTotals(rawCards){
  const cards = rawCards.map(normalizeCard);
  let nonAces=0, aceCount=0;
  for(const c of cards){ if(c.rank==='A') aceCount++; else nonAces += baseValue(c.rank); }
  const totals=new Set([nonAces + aceCount]);
  for(let k=1;k<=aceCount;k++) totals.add(nonAces + aceCount + 10*k);
  return Array.from(totals).sort((a,b)=>a-b);
}
function bestHandTotal(cards){
  const totals=allHandTotals(cards);
  for(let i=totals.length-1;i>=0;i--){ if(totals[i]<=21) return { total: totals[i], isSoft: totals[i]!==totals[0] }; }
  return { total: totals[0], isSoft:false };
}
function displayTotals(cards){
  const totals=allHandTotals(cards);
  const max=totals[totals.length-1];
  const under=totals.filter(t=>t<=21);
  if(under.length===0) return 'BUST';
  const min=under[0];
  return (min!==max) ? `${min} / ${max}` : String(min);
}
function isTenCard(rank){ return rank==='10'||rank==='J'||rank==='Q'||rank==='K'; }
function isBlackjack(rawCards){
  const cards=rawCards.map(normalizeCard);
  if(cards.length!==2) return false;
  const ranks=cards.map(c=>c.rank);
  return (ranks.includes('A') && ranks.some(isTenCard));
}
function isNaturalBlackjack(cards){
  const arr = cards.map(normalizeCard);
  if(arr.length!==2) return false;
  const r=arr.map(c=>c.rank);
  return (r.includes('A') && r.some(isTenCard));
}

// ============================== Calculs / Labels =============================
function playerLabel(cards){
  const totals=allHandTotals(cards);
  const under=totals.filter(t=>t<=21);
  if(cards.length<=2){
    if(under.length>1) return `${under[0]} / ${under[under.length-1]}`;
    return `${under[0] ?? totals[0]}`;
  }
  if(under.length>0) return String(under[under.length-1]);
  return String(totals[0]);
}
function dealerLabel(cards){ const { total } = bestHandTotal(cards); return String(total); }
let shoe=[], pen=0;
function buildShoe(decks=6){ const cards=[]; for(let d=0;d<decks;d++){ for(const s of SUITS){ for(const r of RANKS){ cards.push({rank:r,suit:s}); } } }
  for(let i=cards.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cards[i],cards[j]]=[cards[j],cards[i]]; }
  shoe=cards; pen=Math.floor(cards.length*0.75); toast('Nouveau shoe 6 decks.'); }
function drawCard(){ if(shoe.length<=pen) buildShoe(); return shoe.pop(); }
function handValue(cards){
  const { total, isSoft } = bestHandTotal(cards);
  return { total, soft:isSoft, isBJ: isBlackjack(cards) };
}
function cardAssetPath(rank, suit){
  const suitName = suit==='♠' ? 'spades' : suit==='♥' ? 'hearts' : suit==='♦' ? 'diamonds' : 'clubs';
  const rankName = (rank==='A')?'ace':(rank==='J')?'jack':(rank==='Q')?'queen':(rank==='K')?'king':rank.toLowerCase();
  return `assets/playing-cards-assets/svg-cards/${rankName}_of_${suitName}.svg`;
}
function createCardEl(card, hidden=false){
  const wrap=document.createElement('div'); wrap.className='card-wrap';
  const el=document.createElement('div'); el.className='card flip'+(hidden?' flipped':'');
  const front=document.createElement('div'); front.className='front'; front.style.position='absolute'; front.style.inset='0'; front.style.borderRadius='12px'; front.style.backfaceVisibility='hidden';
  const img=document.createElement('img'); img.className='face-img'; img.alt=`${card.rank} ${card.suit}`; img.src=cardAssetPath(card.rank, card.suit); front.appendChild(img);
  const back=document.createElement('div'); back.className='backface';
  el.appendChild(front); el.appendChild(back); wrap.appendChild(el);
  return wrap;
}
// Fidelity pip layout approximating standard casino decks
function placePips(){ /* no-op: replaced by corner/center marks */ }
function toast(msg,ms=1400){ const t=$("#toast"); t.textContent=msg; t.style.display='block'; clearTimeout(t._to); t._to=setTimeout(()=>t.style.display='none',ms); }

// ============================== Sounds =============================
let dealSounds = [];
try{
  for(let i=1;i<=6;i++){
    const a = new Audio(`assets/Sounds/card-slide-${i}.ogg`);
    a.volume = 0.35;
    dealSounds.push(a);
  }
}catch(e){}
function playDealSound(){
  try{
    if(dealSounds.length){
      const a = dealSounds[Math.floor(Math.random()*dealSounds.length)];
      a.currentTime = 0;
      a.play().catch(()=>{});
    }
  }catch(e){}
}

let chipSound;
try{
  chipSound = new Audio('assets/chip%20sounds/chips-stack-6.ogg');
  chipSound.volume = 0.45;
}catch(e){}
function playChipSound(){ try{ if(chipSound){ chipSound.currentTime=0; chipSound.play().catch(()=>{}); } }catch(e){} }

const state={ balance:5000,lastBets:[0,0,0],bets:[0,0,0],hands:[[],[],[]],dealer:[],activeSeat:0,activeHand:0,inRound:false,awaitInsurance:false,stats:{hands:0,won:0,lost:0,push:0},win:0 };
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


// Fan layout helpers (centered)
const FAN_SPREAD = 280;
const FAN_MAX_ANGLE = 22;
function createFanHost(parent, idx, total){
  const host=document.createElement('div');
  host.style.position='absolute'; host.style.left='50%'; host.style.bottom='0';
  host.style.transformOrigin='bottom center';
  const rel = (total<=1)?0:(idx/(total-1)-0.5);
  const x = rel * FAN_SPREAD; const y = Math.abs(rel) * -14; const angle = rel * FAN_MAX_ANGLE;
  host.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
  host.style.zIndex = String(100+idx); parent.appendChild(host); return host;
}
function ensureDealWrap(area){ let wrap=area.querySelector('.deal-wrap'); if(!wrap){ wrap=document.createElement('div'); wrap.className='deal-wrap'; wrap.style.display='inline-block'; wrap.style.position='relative'; wrap.style.marginRight='12px'; wrap.style.height='calc(104px + 1mm)'; area.appendChild(wrap); } wrap.style.width=(FAN_SPREAD + 74)+'px'; return wrap; }
function refreshBetsUI(){ for(let i=0;i<3;i++) renderSeatStack(i); renderTop(); }
function clearBets(){ state.bets=[0,0,0]; refreshBetsUI(); playChipSound(); }
function rebet(){ state.bets=[...state.lastBets]; refreshBetsUI(); playChipSound(); }

function createAndAnimateCard(toEl, card, faceUp=true){ const temp=createCardEl(card,true); document.body.appendChild(temp);
  const end=toEl.getBoundingClientRect();
  const tx=end.left+end.width/2, ty=end.top+end.height/2;
  const startY = -120; // start from top of screen
  const startX = (window.innerWidth/2)|0; // center-top horizontally
  temp.style.position='fixed'; temp.style.left=(startX-37)+'px'; temp.style.top=startY+'px'; temp.style.transition='transform .42s cubic-bezier(.2,.8,.2,1), opacity .42s, filter .32s ease-out'; temp.style.opacity='0.95'; temp.style.filter='drop-shadow(0 22px 28px rgba(0,0,0,0.55))';
  playDealSound();
  requestAnimationFrame(()=>{ temp.style.transform=`translate(${tx-startX}px, ${ty-startY}px) rotate(${Math.floor(Math.random()*9-4)}deg)`; temp.style.filter='drop-shadow(0 8px 14px rgba(0,0,0,0.38))'; });
  return new Promise(res=>{ temp.addEventListener('transitionend', ()=>{ const real=createCardEl(card,!faceUp); toEl.appendChild(real); if(faceUp){ setTimeout(()=>{ real.querySelector('.card').classList.remove('flipped'); }, 20); } temp.remove(); res(); }, {once:true}); });
}
function flipHoleCard(){ const row=document.querySelector("#dealerRow"); const last=row.children[1]; if(!last) return; last.querySelector('.card').classList.remove('flipped'); }

function pathArc(x1,y1,x2,y2,curve=0.3){ const dx=x2-x1; const cx1=x1+dx*curve, cy1=y1-80; const cx2=x2-dx*curve, cy2=y2-80; return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`; }
function animateChipsPath(fromRect, toRect, count=8){
  playChipSound();
  for(let i=0;i<count;i++){ const el=document.createElement('div'); el.className='motion'; document.body.appendChild(el);
    const sx=fromRect.left+fromRect.width/2+(Math.random()*20-10), sy=fromRect.top+fromRect.height/2+(Math.random()*16-8);
    const tx=toRect.left+toRect.width/2+(Math.random()*20-10), ty=toRect.top+toRect.height/2+(Math.random()*16-8);
    el.style.offsetPath = `path('${pathArc(sx,sy,tx,ty)}')`; setTimeout(()=>el.remove(), 720); }
}

function renderAllHands(){
  const drow=document.querySelector("#dealerRow"); drow.innerHTML=''; drow.style.position='relative';
  state.dealer.forEach((c,i)=>{ const hide=state.inRound && i===1 && !allPlayersDone(); const host=document.createElement('div'); host.style.position='absolute'; host.style.left='50%'; host.style.bottom='0'; host.style.transformOrigin='bottom left'; host.style.transform=`rotate(${(i - (state.dealer.length-1)/2)*12}deg)`; host.style.zIndex=String(10+i); drow.appendChild(host); const el=createCardEl(c, hide); host.appendChild(el); if(!hide) setTimeout(()=> el.querySelector('.card').classList.remove('flipped'), 0); });
  const dLabel = (state.inRound && !allPlayersDone())
    ? displayTotals([state.dealer[0]])
    : dealerLabel(state.dealer);
  document.querySelector("#dealerTotal").textContent = dLabel;
  document.querySelectorAll(".seat").forEach((seat,i)=>{ const area=seat.querySelector('.hand-area'); area.innerHTML='<div class="total-tag">—</div>'; const hands=state.hands[i]||[]; hands.forEach((h,hi)=>{
    const wrap=document.createElement('div'); wrap.style.display='inline-block'; wrap.style.position='relative'; wrap.style.marginRight='12px'; wrap.style.height='calc(104px + 1mm)'; wrap.style.width='74px';
    h.cards.forEach((c,ci)=>{ const host=document.createElement('div'); host.style.position='absolute'; host.style.left='50%'; host.style.bottom='0'; host.style.transformOrigin='bottom left'; host.style.transform=`rotate(${(ci - (h.cards.length-1)/2)*12}deg)`; host.style.zIndex=String(10+ci); wrap.appendChild(host); const el=createCardEl(c,false); host.appendChild(el); setTimeout(()=>el.querySelector('.card').classList.remove('flipped'),0); });
    area.appendChild(wrap); const totalEl=area.querySelector('.total-tag');
    const bestNow = bestHandTotal(h.cards);
    if(RULES.blackjackLabelMode==='any21' && bestNow.total===21){
      totalEl.textContent = 'BLACKJACK!';
    } else {
      totalEl.textContent = playerLabel(h.cards);
    }
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
function refreshControls(){
  if(!state.inRound){
    showBettingControls(true);
    setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false});
    document.querySelectorAll('[data-group="ins"]').forEach(b=>b.classList.add('hidden'));
  } else {
    showBettingControls(false);
    if(state.awaitInsurance){
      setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false});
      document.querySelectorAll('[data-group="ins"]').forEach(b=>b.classList.remove('hidden'));
    } else {
      document.querySelectorAll('[data-group="ins"]').forEach(b=>b.classList.add('hidden'));
      updateActionsForActive();
    }
  }
}

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
  circle.addEventListener('click',()=>{ if(state.inRound) return; state.bets[idx]=+(state.bets[idx]+selectedChip).toFixed(2); state.lastBets[idx]=state.bets[idx]; renderSeatStack(idx); renderTop(); playChipSound(); });
  circle.addEventListener('contextmenu',e=>{ e.preventDefault(); if(state.inRound) return; state.bets[idx]=Math.max(0, +(state.bets[idx]-selectedChip).toFixed(2)); renderSeatStack(idx); renderTop(); playChipSound(); });
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
  renderAllHands(); renderTop(); renderStats();
  offerInsuranceIfEligible();
  refreshControls();
}

function currentHand(){ return (state.hands[state.activeSeat]||[])[state.activeHand]; }
function moveToNextHand(){ for(let s=state.activeSeat;s<3;s++){ const hands=state.hands[s]||[]; for(let i=(s===state.activeSeat?state.activeHand+1:0); i<hands.length; i++){ if(!hands[i].done){ state.activeSeat=s; state.activeHand=i; return true; } } } return false; }

function updateActionsForActive(){
  if(!state.inRound || state.awaitInsurance){ setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false}); return; }
  const h=currentHand(); if(!h){ setActionVisibility({hit:false,stand:false,double:false,split:false,surrender:false}); return; }
  const v=handValue(h.cards);
  let canHit = v.total<21 && !(h.isSplitAce && h.cards.length>=2);
  let canStand = true;
  let canDouble = (h.cards.length===2) && state.balance>=h.bet && !(h.isSplitAce);
  const v10=r=>['10','J','Q','K'].includes(r);
  let canSplit = (h.cards.length===2) && (h.cards[0].rank===h.cards[1].rank || (v10(h.cards[0].rank)&&v10(h.cards[1].rank))) && state.balance>=h.bet && (state.hands[state.activeSeat].length<4);
  let canSurrender = (h.cards.length===2);

  // Validate against engine allowed actions
  try{
    const engine = new Blackjack.Game('Player','Dealer',{numberOfDecks:1, dealerHitSoft17:true});
    engine.player.cards = h.cards.map(c=>({rank:String(c.rank), suit: c.suit==='♠'?'♠':c.suit==='♥'?'♥':c.suit==='♦'?'♦':'♣'}));
    engine.player.history = []; if(h.doubled) engine.player.history.push('Double'); if(h.isSplitAce || (state.hands[state.activeSeat]||[]).length>1) engine.player.history.push('Split');
    const acts = engine.player.getActions();
    const allow = {
      Hit: acts.includes('Hit'),
      Stand: acts.includes('Stand'),
      Double: acts.includes('Double'),
      Split: acts.includes('Split')
    };
    canHit = canHit && allow.Hit;
    canStand = canStand && allow.Stand;
    canDouble = canDouble && allow.Double;
    canSplit = canSplit && allow.Split;
  }catch(e){ /* engine optional */ }

  setActionVisibility({hit:canHit, stand:canStand, double:canDouble, split:canSplit, surrender:canSurrender});
}

function dealerPlayThenSettle(){
  flipHoleCard();
  setTimeout(()=>{
    const softFlag = (cards)=>{
      // Compute sum with all aces as 1
      let sum1=0, hasAce=false;
      for(const c of cards){ const r=String(c.rank).toUpperCase(); if(r==='A'){ sum1+=1; hasAce=true; } else if(['10','J','Q','K'].includes(r)){ sum1+=10; } else sum1+=parseInt(r,10); }
      const total = (hasAce && sum1<12) ? sum1+10 : sum1;
      return { total, isSoft: hasAce && sum1<12 };
    };
    const shouldHit = (cards)=>{
      try{
        if(window.Blackjack && Blackjack.Utils && typeof Blackjack.Utils.score==='function'){
          // Engine score (best total); derive softness similarly to its logic
          let sum1=0, hasAce=false;
          for(const c of cards){ const r=String(c.rank).toUpperCase(); if(r==='A'){ sum1+=1; hasAce=true; } else if(['10','J','Q','K'].includes(r)){ sum1+=10; } else sum1+=parseInt(r,10); }
          const total = (hasAce && sum1<12) ? sum1+10 : sum1;
          return total<17 || (total===17 && hasAce && sum1<12);
        }
      }catch(e){}
      const v=handValue(cards); return v.total<17 || (v.total===17 && v.soft);
    };
    updateDealerUI({cards: state.dealer});
    const loop=()=>{
      if(shouldHit(state.dealer)){
        const row=document.querySelector("#dealerRow"); const host=document.createElement('div'); row.appendChild(host);
        const c=drawCard(); state.dealer.push(c);
        createAndAnimateCard(host,c,true).then(()=>{ updateDealerUI({cards: state.dealer}); setTimeout(loop, 220); });
      } else { settlePayouts(); }
    };
    loop();
  }, 220);
}

function seatRect(idx){ return document.querySelector(`.seat[data-idx="${idx}"] .circle`).getBoundingClientRect(); }
function dealerRect(){ return document.querySelector("#dealerBank").getBoundingClientRect(); }

function settlePayouts(){
  const dRect=dealerRect(); let win=0;
  const outcomes=[[],[],[]];
  for(let s=0;s<3;s++){
    for(const h of (state.hands[s]||[])){
      const pv=handValue(h.cards); const dv=handValue(state.dealer); let out=0;
      if(h.surrender){ out=-h.bet/2; animateChipsPath(seatRect(s), dRect, 8); state.stats.lost++; outcomes[s].push('surrender'); }
      else if(pv.total>21){ out=-h.bet; animateChipsPath(seatRect(s), dRect, 10); state.stats.lost++; outcomes[s].push('playerBust'); }
      else{
        const dealerBJ=dv.isBJ; const bj=(pv.isBJ && h.cards.length===2 && !h.doubled && !h.surrender);
        if(dv.total>21){ out=h.bet; if(bj) out=h.bet*1.5; animateChipsPath(dRect, seatRect(s), 12); state.stats.won++; outcomes[s].push('dealerBust'); }
        else if(bj && !dealerBJ){ out=h.bet*1.5; animateChipsPath(dRect, seatRect(s), 14); state.stats.won++; outcomes[s].push('playerWin'); }
        else if(!bj && dealerBJ){ out=-h.bet; animateChipsPath(seatRect(s), dRect, 10); state.stats.lost++; outcomes[s].push('dealerBlackjack'); }
        else if(pv.total>dv.total){ out=h.bet; animateChipsPath(dRect, seatRect(s), 12); state.stats.won++; outcomes[s].push('playerWin'); }
        else if(pv.total<dv.total){ out=-h.bet; animateChipsPath(seatRect(s), dRect, 10); state.stats.lost++; outcomes[s].push('dealerWin'); }
        else { out=0; state.stats.push++; outcomes[s].push('push'); }
      }
      state.balance += out + h.bet; win += out;
    }
  }
  state.win=win; renderTop(); renderStats();
  // Refresh labels, then optionally override with BLACKJACK! per RULES
  renderAllHands();
  for(let s=0;s<3;s++){
    const hands=state.hands[s]||[];
    hands.forEach((h,hi)=>{
      const area=document.querySelector(`.seat[data-idx="${s}"] .hand-area`);
      const totalEl=area && area.querySelector('.total-tag');
      if(!totalEl) return;
      const best=bestHandTotal(h.cards); const nat=isNaturalBlackjack(h.cards); const outcome=outcomes[s][hi];
      let showBJ=false;
      if(RULES.blackjackLabelMode==='natural') showBJ = nat && outcome!=='dealerWin';
      else if(RULES.blackjackLabelMode==='any21') showBJ = (best.total===21) && (outcome==='playerWin' || outcome==='push');
      if(showBJ) totalEl.textContent='BLACKJACK!';
    });
  }
  toast(win>=0?`Tu gagnes ${money(win)}`:`Tu perds ${money(-win)}`,1800);
  state.inRound=false; refreshControls();
  setTimeout(()=>{
    state.hands=[[],[],[]]; state.dealer=[]; state.win=0; state.bets=[0,0,0]; state.lastBets=[0,0,0];
    renderAllHands(); refreshBetsUI(); renderTop();
  }, 5000);
}


document.querySelector('#deal').addEventListener('click', startRound);
document.querySelector('#clearBets').addEventListener('click',()=>{ if(state.inRound) return; clearBets(); });
document.querySelector('#rebet').addEventListener('click',()=>{ if(state.inRound) return; rebet(); });
document.querySelector('#shuffle').addEventListener('click', buildShoe);

// Insurance flow
function offerInsuranceIfEligible(){
  const up = state.dealer[0];
  const anyBet = state.bets.some(v=>v>0);
  if(up && up.rank==='A' && anyBet){ state.awaitInsurance=true; toast('Insurance available (2:1)'); }
}
function totalInsurancePotential(){
  let need=0; for(let s=0;s<3;s++){ const h=(state.hands[s]||[])[0]; if(h) need += h.bet/2; } return need;
}
function buyInsurance(){
  let spent=0; for(let s=0;s<3;s++){ const h=(state.hands[s]||[])[0]; if(!h) continue; const max=h.bet/2; if(state.balance>=max){ h.insurance=max; state.balance-=max; spent+=max; } }
  if(spent>0){ toast('Insurance placed'); renderTop(); }
}
function resolveInsuranceAfterPeek(){
  const dv=handValue(state.dealer);
  if(state.hands.flat().some(h=>h.insurance>0)){
    if(dv.isBJ){ let pay=0; for(const seat of state.hands){ for(const h of seat){ if(h.insurance){ pay += h.insurance*2; h.insurance=0; } } } state.balance += pay; renderTop(); toast('Insurance wins (2:1)'); }
    else { for(const seat of state.hands){ for(const h of seat){ if(h.insurance){ h.insurance=0; } } } toast('Insurance loses'); }
  }
  if(dv.isBJ){ flipHoleCard(); settlePayouts(); state.awaitInsurance=false; refreshControls(); return; }
  state.awaitInsurance=false; refreshControls();
}

document.querySelector('#insurance').addEventListener('click', ()=>{ if(!state.awaitInsurance) return; buyInsurance(); resolveInsuranceAfterPeek(); });
document.querySelector('#noInsurance').addEventListener('click', ()=>{ if(!state.awaitInsurance) return; resolveInsuranceAfterPeek(); });

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


// ============================== Hooks UI Blackjack =============================
function updatePlayerUI({ cards, outcome }){
  const best = bestHandTotal(cards);
  let showBlackjack=false;
  if(RULES.blackjackLabelMode==='natural'){
    showBlackjack = isNaturalBlackjack(cards) && (outcome ? outcome!=='dealerWin' : true);
  } else if(RULES.blackjackLabelMode==='any21'){
    showBlackjack = (best.total===21) && (outcome ? (outcome==='playerWin'||outcome==='push') : true);
  }
  const el=document.querySelector('#playerTotal');
  if(!el) return; el.textContent = showBlackjack ? 'BLACKJACK!' : playerLabel(cards);
}
function updateDealerUI({ cards }){ const el=document.querySelector('#dealerTotal'); if(!el) return; el.textContent = dealerLabel(cards); }
async function onPlayerHit(drawCardAsync){ await drawCardAsync('player'); const hand=currentHand().cards; const { total }=bestHandTotal(hand); updatePlayerUI({cards:hand}); if(total>21){ roundEnd({ outcome:'playerBust' }); }}
function roundEnd({ outcome }){ const p=currentHand().cards; const d=state.dealer; updatePlayerUI({cards:p, outcome}); updateDealerUI({cards:d}); }
async function dealerDrawLoop(drawCardAsync){ while(true){ const {total,isSoft}=bestHandTotal(state.dealer); if(!(total<17 || (total===17 && isSoft))) break; await drawCardAsync('dealer'); updateDealerUI({cards:state.dealer}); } }
