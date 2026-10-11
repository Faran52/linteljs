interface ElementProps {
  readonly className: string;
}

export const styles = {
  status: { className: 'status' },
  statusCode: { className: 'status-code' },
  statusMessage: { className: 'status-message' },
  statusActions: { className: 'status-actions' },

  action: (outlined: boolean): ElementProps => {
    const props = { className: outlined ? 'status-action status-action-outline' : 'status-action' };

    return props;
  },
};
