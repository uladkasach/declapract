import { readUsePracticesConfig } from '../config/readUsePracticesConfig';
import { displayPlans } from '../plan/display/displayPlans';
import { filterPracticeEvaluationsFromPlans } from '../plan/filterPracticeEvaluationsFromPlans';
import { getPlansForProject } from '../plan/get/getPlansForProject';
import { UnexpectedCodePathError } from '../UnexpectedCodePathError';

export const plan = async ({
  usePracticesConfigPath,
  filter,
}: {
  usePracticesConfigPath: string;
  filter?: {
    practiceNames?: string[];
  };
}) => {
  // read the usage config
  const config = await readUsePracticesConfig({ configPath: usePracticesConfigPath });

  // grab the selected use case's practices
  const useCase = config.declared.useCases.find((useCase) => useCase.name === config.useCase);
  if (!useCase)
    throw new UnexpectedCodePathError(
      'requested use case was not defined on config. should have thrown an error when processing the config by now',
    );

  // get the plans
  const plans = await getPlansForProject({ practices: useCase.practices, projectRootDirectory: config.rootDir });

  // filter the plans
  const plansToDisplay = await filterPracticeEvaluationsFromPlans({
    plans,
    filter: { byPracticeNames: filter?.practiceNames ?? undefined },
  });

  // display the plans
  await displayPlans({ plans: plansToDisplay });
};
