// Props, so `AppHeader.tsx` varies by router alone and not by the styling answer too.
interface ElementProps {
  readonly class: string;
}

export const styles = {
  header: { class: 'header' },
  starterLabel: { class: 'starter-label' },
  brand: { class: 'brand' },
  tabs: { class: 'tabs' },

  tab: (current: boolean): ElementProps => {
    return { class: current ? 'tab tab-button tab-current' : 'tab tab-button' };
  },
};
