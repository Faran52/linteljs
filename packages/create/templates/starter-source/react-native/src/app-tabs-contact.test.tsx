import { DeviceEventEmitter, ScrollView } from 'react-native';

import {
  act,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { CONTACT_COPY } from '@services/contact-form/constants';

import { renderScreen } from '@mocks/renderScreen';

import ContactScreen from './app/(tabs)/contact';

const fill = async (label: string, value: string): Promise<void> => {
  const field = screen.getByLabelText(label);

  await fireEvent.changeText(field, value);
  await fireEvent(field, 'blur');
};

describe('the contact screen', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    await renderScreen(<ContactScreen />);
    await fill('Email', 'not-an-address');

    const element = await screen.findByText('Enter a valid email address.');
    expect(element).toBeTruthy();
  });

  it('flags only the field that was left', async () => {
    await renderScreen(<ContactScreen />);
    await fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');

    const untouched = screen.queryByText('Write a message of at least ten characters.');
    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    await renderScreen(<ContactScreen />);
    await fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'someone@example.com');

    await waitFor(() => {
      const stale = screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing, then holds the button until it is fixed', async () => {
    await renderScreen(<ContactScreen />);
    await fill('Email', 'someone@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByText('Write a message of at least ten characters.');
    expect(element).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Send' });
    expect(button).toBeDisabled();
  });

  it('sends once both fields are valid', async () => {
    await renderScreen(<ContactScreen />);
    await fill('Email', 'someone@example.com');
    await fill('Message', 'Ten characters, at least.');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByRole('status');
    expect(element).toHaveTextContent(CONTACT_COPY.sent);
  });

  it('is the one main landmark on the page, and a keyboard can reach its scroll', async () => {
    await renderScreen(<ContactScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
    expect(landmarks[0]).toHaveProp('tabIndex', 0);
  });

  it('scrolls Send into view once the keyboard is up', async () => {
    const scrollToEnd = jest.spyOn(ScrollView.prototype, 'scrollToEnd');
    await renderScreen(<ContactScreen />);

    await act(() => {
      DeviceEventEmitter.emit('keyboardDidShow', {});
    });

    expect(scrollToEnd).toHaveBeenCalledTimes(1);
  });
});
