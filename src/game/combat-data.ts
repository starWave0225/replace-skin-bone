import { assetUrl } from './asset-url'
export type CombatFace='shen'|'guard'
export type CombatAction='attack'|'observe'|'outline'|'reveal'|'parry'|'bind'|'verdict'|'breathe'|'swap'
export const combatFaces={
  shen:{name:'沈砚之面',role:'画师 · 辨相与破相',portrait:assetUrl('/assets/portraits/shen-v2.webp'),passive:'入微',passiveText:'亲手破相时，额外回复 1 墨息。',moves:['attack','observe','outline','reveal'] as CombatAction[]},
  guard:{name:'周平之面',role:'故捕快 · 格挡与截招',portrait:assetUrl('/assets/portraits/guard-v2.webp'),passive:'不退',passiveText:'守息或架刀实际减伤后，下一次攻击 +4。换面不触发。',moves:['attack','parry','bind','verdict'] as CombatAction[]},
}
export const combatMoves:Record<CombatAction,{name:string;cost:number;skin:number;body:number;face?:CombatFace;description:string}>={
  attack:{name:'普攻',cost:0,skin:0,body:0,description:'结算后回复 1 墨息。'},
  observe:{name:'辨相',cost:1,skin:0,body:0,face:'shen',description:'揭示伪装意图。识破持续后续 3 次行动，下一次攻击额外 +8。'},
  outline:{name:'勾线',cost:1,skin:16,body:6,face:'shen',description:'沿假脸接缝落笔，擅长迅速破相。'},
  reveal:{name:'落笔见真',cost:3,skin:10,body:24,face:'shen',description:'显形后伤形 24；有皮相时只破相 10。'},
  parry:{name:'架刀',cost:1,skin:12,body:12,face:'guard',description:'本次敌方伤害减免 75%；遇直接扑击时反击一次，施术不触发反击。'},
  bind:{name:'拘影',cost:2,skin:14,body:8,face:'guard',description:'破相 14 / 伤形 8；意图标注可截断时取消本回合敌意，下回合冷却。'},
  verdict:{name:'断案',cost:3,skin:0,body:28,face:'guard',description:'仅显形时可用，以一刀集中伤形 28。'},
  breathe:{name:'守息',cost:0,skin:0,body:0,description:'回复 2 墨息，本次敌方阶段伤害减半。'},
  swap:{name:'换面',cost:0,skin:0,body:0,description:'占一次行动，切换另一张面；本次敌方伤害减半，下回合不能再换。'},
}
export interface CombatIntent {name:string;kind:'attack'|'hex'|'charge';hits:number[];description:string;danger:string;interruptible?:boolean;concealed?:boolean}
export const combatIntents:CombatIntent[]=[
  {name:'扯袖',kind:'attack',hits:[8],description:'近身扑击，伤形 8。',danger:'轻'},
  {name:'浮面',kind:'hex',hits:[10],description:'假面隔空施术，伤形 10；架刀不会反击。',danger:'中',concealed:true},
  {name:'水缚蓄势',kind:'charge',hits:[],description:'本回合蓄势，不造成伤害；下一回合夺相。',danger:'蓄势',interruptible:true},
  {name:'夺相',kind:'attack',hits:[24],description:'重击伤形 24，可用拘影截断当回合。',danger:'重',interruptible:true},
  {name:'抽丝',kind:'attack',hits:[6,6],description:'两段直接攻击，各伤形 6；架刀只反击一次。',danger:'连击'},
]
