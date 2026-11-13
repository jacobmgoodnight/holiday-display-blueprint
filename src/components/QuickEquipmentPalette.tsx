import type {Kind} from '../lib/model';
import './quickEquipmentPalette.css';
const choices:{kind:Kind;label:string;icon:string}[]=[
 {kind:'outlet',label:'Outlet',icon:'🔌'}, {kind:'smart-plug',label:'Smart plug',icon:'⏱'},
 {kind:'cord',label:'Cord',icon:'〰'}, {kind:'splitter',label:'Splitter',icon:'⑂'},
 {kind:'light-strand',label:'Lights',icon:'✨'}, {kind:'decoration',label:'Decoration',icon:'🎄'}
];
export function QuickEquipmentPalette({value,onChange}:{value?:Kind;onChange:(kind:Kind)=>void}){
 return <div className="quick-equipment-palette" role="group" aria-label="Common equipment types">{choices.map(choice=><button type="button" key={choice.kind} aria-pressed={value===undefined?undefined:value===choice.kind} onClick={()=>onChange(choice.kind)}><span aria-hidden="true">{choice.icon}</span>{choice.label}</button>)}</div>;
}
