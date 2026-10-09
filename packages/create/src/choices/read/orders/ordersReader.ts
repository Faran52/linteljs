import { parseLinteljsConfig, projectAnswersOf } from '@answers';

import type { Answers } from '@config/types';

export interface Order {
  name: string;
  answers: Answers;
}

// One order per recorded project, a version-one config migrated on the way; a single layout's project takes `name`.
export const ordersReader = (text: string, name: string): Order[] => {
  const config = parseLinteljsConfig(text);

  return config.projects
    .map((project) => {
      const order: Order = {
        name: project.name ?? name,
        answers: projectAnswersOf(config, project),
      };

      return order;
    });
};
