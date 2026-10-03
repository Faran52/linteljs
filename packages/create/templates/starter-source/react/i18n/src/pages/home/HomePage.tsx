import { Trans, useTranslation } from 'react-i18next';

import { CHECK } from '@config/linteljs';

import { Mark } from '@ui';

import type { FC } from 'react';

export interface HomePageProps {
  readonly name: string;
}

const CODE = { code: <code /> };
const CHECK_VALUES = { command: CHECK };

export const HomePage: FC<HomePageProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{name}</h1>
      <p className="lede">{t('homeLedeReact')}</p>
      <p className="hint">
        <Trans
          i18nKey="gateHint"
          values={CHECK_VALUES}
          components={CODE}
        />
      </p>
    </main>
  );
};
