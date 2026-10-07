import { MSW_COPY } from '../constants';

export const withMswCopy = (source: string): string => {
  return MSW_COPY
    .reduce((text, [local, posted]) => {
      return text.replaceAll(local, posted);
    }, source);
};
