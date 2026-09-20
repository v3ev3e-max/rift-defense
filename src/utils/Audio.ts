import {assetUrl} from './assets';

const soundFiles={attack:'attack.mp3',sniper:'sniper.mp3',laser:'laser.mp3',melee:'melee.mp3',explosion:'explosion.mp3',drone:'drone.mp3',summon:'summon.mp3',merge:'merge.mp3',level:'level.mp3',relic:'relic.wav',critical:'critical.wav',core:'core-hit.wav',block:'shield-block.wav','skill-guard':'skill-guard.mp3','skill-support':'skill-support.mp3','skill-sniper':'skill-sniper.mp3','skill-impact':'skill-impact.mp3',boss:'boss.mp3',victory:'victory.mp3',defeat:'defeat.mp3'} as const;
type SoundKind=keyof typeof soundFiles;
export type MusicKind='maint'|'formation'|'recruit'|'battle1'|'battle2';
const musicFiles:Record<MusicKind,string>={maint:'menu-maint.ogg',formation:'menu-formation.ogg',recruit:'menu-recruit.ogg',battle1:'battle-region-1.ogg',battle2:'battle-region-2.ogg'};
const backgroundKinds=new Set<SoundKind>(['boss']);
const volumes:Record<SoundKind,number>={attack:.13,sniper:.20,laser:.14,melee:.17,explosion:.14,drone:.12,summon:.22,merge:.23,level:.21,relic:.23,critical:.18,core:.22,block:.2,'skill-guard':.28,'skill-support':.25,'skill-sniper':.3,'skill-impact':.27,boss:.18,victory:.25,defeat:.23};
const MUSIC_GAIN=.52;
const cooldowns:Partial<Record<SoundKind,number>>={attack:.11,laser:.12,melee:.13,explosion:.18,drone:.2,sniper:.18};

export class GameAudio {
  context?:AudioContext;
  enabled=true;
  bgmEnabled=true;
  sfxEnabled=true;
  bgmVolume=.65;
  sfxVolume=.8;
  pools=new Map<SoundKind,HTMLAudioElement[]>();
  cursor=new Map<SoundKind,number>();
  last=new Map<SoundKind,number>();
  playbackToken=new WeakMap<HTMLAudioElement,number>();
  music?:HTMLAudioElement;
  musicKind?:MusicKind;
  desiredMusic?:MusicKind;
  unlock(){
    if(!this.enabled)return;
    try{this.context??=new AudioContext();if(this.context.state==='suspended')void this.context.resume().catch(()=>{});}catch{/* Audio samples still work without Web Audio. */}
    if(!this.pools.size){
      for(const [kind,file] of Object.entries(soundFiles) as [SoundKind,string][]){
        const count=['attack','laser','melee'].includes(kind)?4:2;
        this.pools.set(kind,Array.from({length:count},()=>{const audio=new Audio(assetUrl(`/assets/audio/${file}`));audio.preload='auto';audio.volume=this.volume(kind);return audio;}));
      }
    }
    if(this.music&&this.desiredMusic&&this.bgmEnabled)this.resumeMusic();
  }
  volume(kind:SoundKind){return volumes[kind]*(backgroundKinds.has(kind)?this.bgmVolume:this.sfxVolume);}
  configure(settings:{sound:boolean;bgm:boolean;sfx:boolean;bgmVolume:number;sfxVolume:number}){
    this.enabled=settings.sound;this.bgmEnabled=settings.bgm;this.sfxEnabled=settings.sfx;this.bgmVolume=Math.max(0,Math.min(1,settings.bgmVolume));this.sfxVolume=Math.max(0,Math.min(1,settings.sfxVolume));
    for(const [kind,pool] of this.pools)for(const audio of pool)audio.volume=this.volume(kind);
    if(this.music)this.music.volume=MUSIC_GAIN*this.bgmVolume;
    if(!this.enabled||!this.bgmEnabled)this.stop('boss');
    if(!this.enabled||!this.bgmEnabled)this.music?.pause();else if(this.desiredMusic)this.resumeMusic();
    if(!this.enabled||!this.sfxEnabled)for(const kind of Object.keys(soundFiles) as SoundKind[])if(!backgroundKinds.has(kind))this.stop(kind);
  }
  setMusic(kind?:MusicKind){
    this.desiredMusic=kind;
    if(!kind){if(this.music){this.music.pause();this.music.currentTime=0;}this.music=undefined;this.musicKind=undefined;return;}
    if(this.musicKind===kind&&this.music){if(this.enabled&&this.bgmEnabled&&this.music.paused)this.resumeMusic();return;}
    if(this.music){this.music.pause();this.music.currentTime=0;}
    const audio=new Audio(assetUrl(`/assets/audio/${musicFiles[kind]}`));audio.loop=true;audio.preload='auto';audio.volume=MUSIC_GAIN*this.bgmVolume;
    this.music=audio;this.musicKind=kind;
    if(this.enabled&&this.bgmEnabled)this.resumeMusic();
  }
  private resumeMusic(){if(!this.music||!this.desiredMusic||!this.enabled||!this.bgmEnabled)return;this.music.volume=MUSIC_GAIN*this.bgmVolume;void this.music.play().catch(()=>{});}
  play(requested:string){
    if(!this.enabled)return;
    if(requested==='boss-end'){this.stop('boss');return;}
    this.unlock();
    const kind=(requested in soundFiles?requested:'attack') as SoundKind;
    if(backgroundKinds.has(kind)?!this.bgmEnabled:!this.sfxEnabled)return;
    const now=performance.now()/1000,last=this.last.get(kind)??-99;
    if(now-last<(cooldowns[kind]??.04))return;
    this.last.set(kind,now);
    const pool=this.pools.get(kind);if(!pool?.length)return;
    const index=this.cursor.get(kind)??0,audio=pool[index%pool.length];this.cursor.set(kind,index+1);
    try{audio.pause();audio.currentTime=0;audio.volume=this.volume(kind);audio.playbackRate=['attack','laser','melee','drone'].includes(kind)?.94+Math.random()*.12:1;const token=(this.playbackToken.get(audio)??0)+1;this.playbackToken.set(audio,token);void audio.play().catch(()=>{});const limit=kind==='boss'?2.4:kind==='drone'?1.1:kind==='explosion'||kind==='core'?.9:0;if(limit)setTimeout(()=>{if(this.playbackToken.get(audio)===token){audio.pause();audio.currentTime=0;}},limit*1000);}catch{/* Muted and restricted browsers remain playable. */}
  }
  stop(kind:SoundKind){for(const audio of this.pools.get(kind)??[]){this.playbackToken.set(audio,(this.playbackToken.get(audio)??0)+1);try{audio.pause();audio.currentTime=0;}catch{/* Audio may disappear during page teardown. */}}}
}
