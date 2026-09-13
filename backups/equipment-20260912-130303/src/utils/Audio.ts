import {assetUrl} from './assets';

const soundFiles={attack:'attack.mp3',sniper:'sniper.mp3',laser:'laser.mp3',melee:'melee.mp3',explosion:'explosion.mp3',drone:'drone.mp3',summon:'summon.mp3',merge:'merge.mp3',level:'level.mp3',relic:'level.mp3',critical:'laser.mp3',core:'explosion.mp3',boss:'boss.mp3',victory:'victory.mp3',defeat:'defeat.mp3'} as const;
type SoundKind=keyof typeof soundFiles;
const volumes:Record<SoundKind,number>={attack:.13,sniper:.20,laser:.14,melee:.17,explosion:.14,drone:.12,summon:.22,merge:.23,level:.21,relic:.23,critical:.18,core:.22,boss:.18,victory:.25,defeat:.23};
const cooldowns:Partial<Record<SoundKind,number>>={attack:.11,laser:.12,melee:.13,explosion:.18,drone:.2,sniper:.18};

export class GameAudio {
  context?:AudioContext;
  enabled=true;
  pools=new Map<SoundKind,HTMLAudioElement[]>();
  cursor=new Map<SoundKind,number>();
  last=new Map<SoundKind,number>();
  unlock(){
    if(!this.enabled)return;
    try{this.context??=new AudioContext();if(this.context.state==='suspended')void this.context.resume().catch(()=>{});}catch{/* Audio samples still work without Web Audio. */}
    if(this.pools.size)return;
    for(const [kind,file] of Object.entries(soundFiles) as [SoundKind,string][]){
      const count=['attack','laser','melee'].includes(kind)?4:2;
      this.pools.set(kind,Array.from({length:count},()=>{const audio=new Audio(assetUrl(`/assets/audio/${file}`));audio.preload='auto';audio.volume=volumes[kind];return audio;}));
    }
  }
  play(requested:string){
    if(!this.enabled)return;
    this.unlock();
    const kind=(requested in soundFiles?requested:'attack') as SoundKind;
    const now=performance.now()/1000,last=this.last.get(kind)??-99;
    if(now-last<(cooldowns[kind]??.04))return;
    this.last.set(kind,now);
    const pool=this.pools.get(kind);if(!pool?.length)return;
    const index=this.cursor.get(kind)??0,audio=pool[index%pool.length];this.cursor.set(kind,index+1);
    try{audio.pause();audio.currentTime=0;audio.playbackRate=['attack','laser','melee','drone'].includes(kind)?.94+Math.random()*.12:1;void audio.play().catch(()=>{});const limit=kind==='boss'?2.4:kind==='drone'?1.1:kind==='explosion'||kind==='core'?.9:0;if(limit)setTimeout(()=>{if(!audio.paused&&audio.currentTime>=limit){audio.pause();audio.currentTime=0;}},limit*1000);}catch{/* Muted and restricted browsers remain playable. */}
  }
}
