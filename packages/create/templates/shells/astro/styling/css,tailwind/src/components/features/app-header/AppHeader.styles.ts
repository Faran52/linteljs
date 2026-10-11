interface ElementProps {
  readonly class: string;
}

export const styles = {
  header: { class: 'header' },
  starterLabel: { class: 'starter-label' },
  brand: { class: 'brand' },
  tabs: { class: 'tabs' },

  tab: (current: boolean): ElementProps => {
    const props = { class: current ? 'tab tab-button tab-current' : 'tab tab-button' };

    return props;
  },
};
