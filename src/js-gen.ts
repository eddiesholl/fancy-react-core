import { generate as astring } from "astring";

export const genJs = (estree): string => {
  return astring(estree, { indent: '  ' });
};
export const genJsList = (estreeList): string => {
  return estreeList.map(genJs).join('\n');
};
