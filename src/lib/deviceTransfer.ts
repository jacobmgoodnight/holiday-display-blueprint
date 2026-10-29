import type {Project} from './model';

/** Browser storage is device-local. Prompt only when this device still has starter examples. */
export function hasOnlyExamples(projects: readonly Project[]): boolean {
 return projects.length > 0 && projects.every(p => p.example === true);
}
