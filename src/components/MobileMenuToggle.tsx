import {Menu,X} from 'lucide-react';

type Props={open:boolean;onToggle:()=>void};
/** One accessible mobile menu trigger, independent of the desktop actions dropdown. */
export function MobileMenuToggle({open,onToggle}:Props){
 return <button type="button" className="icon-button mobile-only mobile-header-menu"
   aria-label={open?'Close menu':'Open menu'}
   aria-controls="mobile-navigation"
   aria-expanded={open}
   onClick={onToggle}>
  {open?<X size={21}/>:<Menu size={21}/>}<span>Menu</span>
 </button>;
}
