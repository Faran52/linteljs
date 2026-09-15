import { createFileRoute } from '@tanstack/react-router';

import App from '../App';

// One file per route. A page lives in `src/pages/<kebab>/{Name}Page.tsx`; the route file only names it.
export const Route = createFileRoute('/')({ component: App });
