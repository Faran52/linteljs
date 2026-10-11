interface ElementProps {
  readonly class: string;
}

export const styles = {
  status: { class: 'status' },
  statusCode: { class: 'status-code' },
  statusMessage: { class: 'status-message' },
  statusActions: { class: 'status-actions' },

  action: (outlined: boolean): ElementProps => {
    const props = { class: outlined ? 'status-action status-action-outline' : 'status-action' };

    return props;
  },
};
