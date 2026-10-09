import { useTranslation } from 'react-i18next';

import { Mark } from '@ui';

import type { ItemsState } from '@apis/items/itemsApi';
import type { FC } from 'react';

export interface ItemListProps {
  readonly state: ItemsState;
}

export const ItemList: FC<ItemListProps> = ({ state }) => {
  const { t } = useTranslation();

  if (state.status === 'pending') {
    return <Mark />;
  }

  if (state.status === 'error') {
    return <p className="note" role="alert">{t('listError')}</p>;
  }

  if (state.items.length === 0) {
    return <p className="note">{t('listEmpty')}</p>;
  }

  return (
    <ul className="rows">
      {state.items
        .map(({ id, name }) => {
          return (
            <li key={id} className="row">
              <code className="key">{name}</code>
            </li>
          );
        })}
    </ul>
  );
};
