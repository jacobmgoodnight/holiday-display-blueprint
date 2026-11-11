import './photoNextSteps.css';

type Props={
 itemName:string;
 canConnect:boolean;
 onEdit:()=>void;
 onConnect:()=>void;
 onDrawAnother:()=>void;
 onMeasure:()=>void;
 onDismiss:()=>void;
};

/** Suggestions after saving a photo route; actions remain explicit and controlled by the parent. */
export function PhotoNextSteps({itemName,canConnect,onEdit,onConnect,onDrawAnother,onMeasure,onDismiss}:Props){
 return <section className="photo-next-steps" aria-label="New route next steps">
  <div className="photo-next-heading"><div><strong>Saved: {itemName}</strong><p>Your visual route is saved. Choose what to do next.</p></div><button type="button" className="photo-next-dismiss" onClick={onDismiss} aria-label="Dismiss next steps">×</button></div>
  <div className="photo-next-actions"><button type="button" onClick={onEdit}>Name or edit</button>{canConnect&&<button type="button" onClick={onConnect}>Connect</button>}<button type="button" onClick={onDrawAnother}>Draw another</button><button type="button" onClick={onMeasure}>Estimate length</button></div>
  <small>A drawn route does not create a power connection. Photo length estimates are approximate.</small>
 </section>;
}
