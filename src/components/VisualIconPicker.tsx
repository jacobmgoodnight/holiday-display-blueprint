import {getVisualIcon,suggestedIcons,visualIcons} from '../lib/visualIcons';
import type {Kind,Season} from '../lib/model';
import './visualExtras.css';
type Props={season:Season;kind:Kind;value?:string;onChange:(value:string|undefined)=>void;compact?:boolean};
export function VisualIconPicker({season,kind,value,onChange,compact=false}:Props){
 const icons=suggestedIcons(season,kind);
 const relevant=icons.filter(x=>x.kinds?.includes(kind));
 const groups=compact?['Suggested','All icons']:['Suggested','Halloween','Christmas','Electrical','General'];
 return <div className="visual-icon-picker">
  <div className="visual-icon-heading"><strong>Diagram icon</strong><span>{getVisualIcon(value)?.label||'Default type icon'}</span></div>
  <div className="visual-icon-suggested" role="group" aria-label="Suggested visual icons">
   <button className={!value?'selected':''} aria-pressed={!value} onClick={()=>onChange(undefined)} title="Default functional icon">Default</button>
   {relevant.slice(0,compact?8:10).map(icon=><button type="button" key={icon.id} title={icon.label} aria-label={icon.label} aria-pressed={value===icon.id} className={value===icon.id?'selected':''} onClick={()=>onChange(icon.id)}><span>{icon.emoji}</span><small>{icon.label}</small></button>)}
  </div>
  <details className="visual-icon-all"><summary>Browse {visualIcons.length} icons</summary>
   {groups.filter(x=>x!=='Suggested'&&x!=='All icons').map(group=><section key={group}><h4>{group}</h4><div className="visual-icon-grid">{icons.filter(icon=>icon.group===group).map(icon=><button type="button" key={icon.id} title={icon.label} aria-label={icon.label} aria-pressed={value===icon.id} className={value===icon.id?'selected':''} onClick={()=>onChange(icon.id)}><span>{icon.emoji}</span><small>{icon.label}</small></button>)}</div></section>)}
   {compact&&<div className="visual-icon-grid">{icons.map(icon=><button type="button" key={icon.id} aria-pressed={value===icon.id} className={value===icon.id?'selected':''} onClick={()=>onChange(icon.id)}><span>{icon.emoji}</span><small>{icon.label}</small></button>)}</div>}
  </details>
 </div>;
}
