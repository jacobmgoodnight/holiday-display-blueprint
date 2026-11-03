import {Lightbulb,PlugZap} from 'lucide-react';
import './emptyDisplayStart.css';

type Props={onAddPowerSource:()=>void;onAddEquipment:()=>void;onOpenPhoto?:()=>void};

/** Starting guidance only: adding anything remains an explicit user action. */
export function EmptyDisplayStart({onAddPowerSource,onAddEquipment,onOpenPhoto}:Props){
 return <section className="empty-display-start" aria-labelledby="empty-display-title">
  <span className="empty-display-eyebrow">YOUR NEW DISPLAY</span>
  <h2 id="empty-display-title">Build your display, one piece at a time</h2>
  <p>Start with what you know. You can add details and connections as you plan or set up.</p>
  <ol className="empty-display-steps">
   <li><strong>Add a power source</strong><span>Record an outlet you plan to use, if you know it.</span></li>
   <li><strong>Add your equipment</strong><span>Include decorations, lights, cords and splitters.</span></li>
   <li><strong>Connect the pieces</strong><span>Use the diagram to record how they actually connect.</span></li>
  </ol>
  <div className="empty-display-actions">
   <button type="button" className="empty-display-primary" onClick={onAddPowerSource}><PlugZap size={18} aria-hidden="true"/> Add a power source</button>
   <button type="button" className="empty-display-secondary" onClick={onAddEquipment}><Lightbulb size={18} aria-hidden="true"/> Add equipment first</button>
   {onOpenPhoto&&<button type="button" className="empty-display-secondary" onClick={onOpenPhoto}>Start with a property photo</button>}
  </div>
  <p className="empty-display-note">Don't know the power source yet? Add equipment first and connect it later.</p>
 </section>;
}
