import type {Project,Component} from './model';
import {now} from './model';
export const portName=(n:Pick<Component,'portLabels'|'outputs'>,index:number)=>{
 const custom=n.portLabels?.[String(index)]?.trim();
 return custom||`Output ${index+1}`;
};
export function renameOutputPort(p:Project,nodeId:string,index:number,label:string):Project{
 const node=p.nodes.find(n=>n.id===nodeId);
 if(!node)throw Error('Component does not exist');
 if(!Number.isInteger(index)||index<0||index>=node.outputs)throw Error('Choose an existing output');
 const trimmed=label.trim();
 if(trimmed.length>40)throw Error('Port label must be 40 characters or fewer');
 const labels={...node.portLabels};
 if(trimmed)labels[String(index)]=trimmed;
 else delete labels[String(index)];
 if((node.portLabels?.[String(index)]||'')===(labels[String(index)]||''))return p;
 return {...p,nodes:p.nodes.map(n=>n.id===nodeId?{...n,portLabels:labels}:n),updatedAt:now()};
}
