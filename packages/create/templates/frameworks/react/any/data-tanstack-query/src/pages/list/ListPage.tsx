import { useTranslation } from 'react-i18next';

import { useItems } from '@apis/items/itemsApi';

import { ItemList } from '@features/item-list/ItemList';

import type { FC } from 'react';

export const ListPage: FC = () => {
  const { t } = useTranslation();
  const state = useItems();

  return (
    <main className="page">
      <h1 className="page-title">{t('list')}</h1>
      <p className="page-lede">{t('listLede')}</p>

      <section className="section">
        <ItemList state={state} />
      </section>
    </main>
  );
};

export default ListPage;
